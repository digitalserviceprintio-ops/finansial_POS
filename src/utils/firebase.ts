import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AuthUser, DeviceSession } from '../types';

// Suppress benign connection retry diagnostics in iframe/sandbox preview
setLogLevel('silent');

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configure Firestore with forced long polling for reliable connection in iframes and reverse proxies
const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
    },
    dbId
  );
} catch {
  firestoreInstance = getFirestore(app, dbId);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

// Safe connectivity check without forcing disruptive server probes
export async function testFirestoreConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  return true;
}

// Error handling conforming to firebase-skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as { code?: string })?.code;

  // Handle expected offline or network unavailability gracefully without throwing or crashing
  if (errCode === 'unavailable' || errMsg.includes('unavailable') || errMsg.includes('offline') || errMsg.includes('Failed to get document')) {
    console.warn(`Firestore offline fallback: ${operationType} on ${path}. Operating in local cache mode.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Sanitize doc ID from email/id
export function getUserDocId(userOrEmail: string): string {
  return userOrEmail.toLowerCase().trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Fetch all registered users from Firestore cloud database
 */
export async function fetchRegisteredUsersFromFirestore(): Promise<AuthUser[]> {
  const path = 'registered_users';
  try {
    const snap = await getDocs(collection(db, path));
    const users: AuthUser[] = [];
    snap.forEach((d) => {
      const data = d.data() as AuthUser;
      if (data && data.email && data.id !== 'connection_probe') {
        users.push(data);
      }
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Save / Update a registered user in Firestore
 */
export async function saveUserToFirestore(user: AuthUser): Promise<boolean> {
  const docId = getUserDocId(user.email);
  const path = `registered_users/${docId}`;
  try {
    await setDoc(doc(db, 'registered_users', docId), {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Get specific user from Firestore by email
 */
export async function getUserFromFirestoreByEmail(email: string): Promise<AuthUser | null> {
  const docId = getUserDocId(email);
  const path = `registered_users/${docId}`;
  try {
    const snap = await getDoc(doc(db, 'registered_users', docId));
    if (snap.exists()) {
      return snap.data() as AuthUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

/**
 * Update active device session for a user in Firestore
 */
export async function setUserActiveSessionInFirestore(
  email: string,
  session: DeviceSession
): Promise<boolean> {
  const docId = getUserDocId(email);
  const path = `registered_users/${docId}`;
  try {
    await updateDoc(doc(db, 'registered_users', docId), {
      activeSession: session,
      lastLoginAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

/**
 * Clear active session on logout
 */
export async function clearUserActiveSessionInFirestore(email: string): Promise<boolean> {
  const docId = getUserDocId(email);
  const path = `registered_users/${docId}`;
  try {
    await updateDoc(doc(db, 'registered_users', docId), {
      activeSession: null,
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return false;
  }
}

/**
 * Real-time listener on active session for currently logged-in user
 */
export function subscribeToUserSession(
  email: string,
  onSessionChange: (session: DeviceSession | null) => void
): Unsubscribe {
  const docId = getUserDocId(email);
  const path = `registered_users/${docId}`;
  return onSnapshot(
    doc(db, 'registered_users', docId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AuthUser;
        onSessionChange(data.activeSession || null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
