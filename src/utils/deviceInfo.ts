/**
 * Device identification and detection utilities for DelPOS single-device session enforcement
 */

export interface CurrentDeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'desktop' | 'mobile' | 'tablet';
}

export function getDeviceId(): string {
  try {
    let devId = localStorage.getItem('delpos_device_id');
    if (!devId) {
      devId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('delpos_device_id', devId);
    }
    return devId;
  } catch {
    return 'dev_temp_' + Math.random().toString(36).substring(2, 9);
  }
}

export function getDeviceFriendlyName(): string {
  if (typeof window === 'undefined' || !navigator) {
    return 'Perangkat Web';
  }

  const ua = navigator.userAgent || '';
  let os = 'Perangkat';
  let browser = 'Browser';
  let isMobile = false;

  // Detect OS
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows PC';
  else if (/macintosh|mac os x/i.test(ua)) os = 'MacBook/macOS';
  else if (/android/i.test(ua)) {
    os = 'Android';
    isMobile = true;
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = /ipad/i.test(ua) ? 'iPad' : 'iPhone';
    isMobile = true;
  } else if (/linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua) && !/opr|opera/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Apple Safari';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  // Screen size classification
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const deviceType = isMobile || screenWidth < 768 ? 'Smartphone' : screenWidth < 1024 ? 'Tablet' : 'Desktop/PC';

  return `${deviceType} (${os} - ${browser})`;
}

export function getDevicePlatform(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  const ua = navigator.userAgent || '';
  if (/tablet|ipad/i.test(ua) || (width >= 640 && width < 1024)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua) || width < 640) return 'mobile';
  return 'desktop';
}

export function getCurrentDeviceInfo(): CurrentDeviceInfo {
  return {
    deviceId: getDeviceId(),
    deviceName: getDeviceFriendlyName(),
    platform: getDevicePlatform(),
  };
}
