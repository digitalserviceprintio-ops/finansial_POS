import { Transaction, StoreProfile } from '../types';
import { buildReceiptEscPos, buildTestPrintEscPos, PaperWidth } from './escpos';

// Common Bluetooth Thermal Printer Service UUIDs
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  '0000e781-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART (Common in Chinese thermal printers)
  '0000fee7-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '00001801-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothPrinterState {
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  deviceName: string | null;
  deviceId: string | null;
  error: string | null;
  paperWidth: PaperWidth;
  autoPrintOnCheckout: boolean;
  lastPrintTimestamp: number | null;
}

type StateListener = (state: BluetoothPrinterState) => void;

class BluetoothPrinterService {
  private device: any = null;
  private gattServer: any = null;
  private writeCharacteristic: any = null;
  private listeners: Set<StateListener> = new Set();

  private state: BluetoothPrinterState = {
    isConnected: false,
    isConnecting: false,
    isPrinting: false,
    deviceName: null,
    deviceId: null,
    error: null,
    paperWidth: '58mm',
    autoPrintOnCheckout: false,
    lastPrintTimestamp: null,
  };

  constructor() {
    this.loadSavedSettings();
  }

  private loadSavedSettings() {
    try {
      const saved = localStorage.getItem('finansialpro_bt_printer_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state.paperWidth = parsed.paperWidth || '58mm';
        this.state.autoPrintOnCheckout = !!parsed.autoPrintOnCheckout;
        this.state.deviceName = parsed.deviceName || null;
      }
    } catch {
      // ignore
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem(
        'finansialpro_bt_printer_settings',
        JSON.stringify({
          paperWidth: this.state.paperWidth,
          autoPrintOnCheckout: this.state.autoPrintOnCheckout,
          deviceName: this.state.deviceName,
        })
      );
    } catch {
      // ignore
    }
  }

  public getState(): BluetoothPrinterState {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
    this.saveSettings();
  }

  public setPaperWidth(width: PaperWidth) {
    this.state.paperWidth = width;
    this.notify();
  }

  public setAutoPrintOnCheckout(enabled: boolean) {
    this.state.autoPrintOnCheckout = enabled;
    this.notify();
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  /**
   * Request user to pair and connect to a Bluetooth thermal printer
   */
  public async connect(): Promise<{ success: boolean; message: string }> {
    if (!this.isBluetoothSupported()) {
      const errMsg =
        'Browser ini belum mendukung Web Bluetooth API secara langsung. Anda dapat menggunakan Chrome/Edge di Android/Desktop, atau gunakan aplikasi RawBT.';
      this.state.error = errMsg;
      this.notify();
      return { success: false, message: errMsg };
    }

    try {
      this.state.isConnecting = true;
      this.state.error = null;
      this.notify();

      // Request Bluetooth device pairing
      const navAny = navigator as any;
      const device = await navAny.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!device) {
        throw new Error('Tidak ada perangkat printer yang dipilih.');
      }

      this.device = device;
      this.state.deviceName = device.name || 'Printer Bluetooth';
      this.state.deviceId = device.id;

      // Handle disconnection event
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect();
      });

      // Connect GATT Server
      const server = await device.gatt.connect();
      this.gattServer = server;

      // Locate writable characteristic
      const char = await this.findWriteCharacteristic(server);
      if (!char) {
        throw new Error(
          'Tidak dapat menemukan characteristic data thermal printer pada perangkat ini.'
        );
      }

      this.writeCharacteristic = char;
      this.state.isConnected = true;
      this.state.isConnecting = false;
      this.state.error = null;
      this.notify();

      return {
        success: true,
        message: `Berhasil terhubung ke printer Bluetooth: ${this.state.deviceName}`,
      };
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      this.state.isConnected = false;
      this.state.isConnecting = false;
      this.state.error = err.message || 'Gagal menghubungkan printer Bluetooth.';
      this.notify();
      return { success: false, message: this.state.error };
    }
  }

  /**
   * Disconnect the current Bluetooth printer
   */
  public disconnect() {
    try {
      if (this.gattServer && this.gattServer.connected) {
        this.gattServer.disconnect();
      }
    } catch (e) {
      console.warn(e);
    }
    this.handleDisconnect();
  }

  private handleDisconnect() {
    this.writeCharacteristic = null;
    this.gattServer = null;
    this.state.isConnected = false;
    this.state.isConnecting = false;
    this.notify();
  }

  /**
   * Scans primary services to find a characteristic with write or writeWithoutResponse property
   */
  private async findWriteCharacteristic(server: any): Promise<any> {
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              return char;
            }
          }
        } catch {
          // continue checking other services
        }
      }
    } catch {
      // If getPrimaryServices fails, attempt standard printer service lookup
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              return char;
            }
          }
        } catch {
          // continue
        }
      }
    }
    return null;
  }

  /**
   * Send binary data in small chunks (e.g. 100 bytes) with a small delay to avoid buffer overflow
   */
  public async sendData(data: Uint8Array): Promise<boolean> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    const chunkSize = 100;
    const totalChunks = Math.ceil(data.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.slice(start, end);

      if (this.writeCharacteristic.writeValueWithoutResponse) {
        await this.writeCharacteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.writeCharacteristic.writeValue(chunk);
      }

      // Small pause between chunks to give thermal buffer time to process
      if (i < totalChunks - 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }

    return true;
  }

  /**
   * Print a test receipt via connected Bluetooth printer
   */
  public async printTest(store: StoreProfile): Promise<{ success: boolean; message: string }> {
    if (!this.state.isConnected || !this.writeCharacteristic) {
      return {
        success: false,
        message: 'Printer Bluetooth belum terhubung. Silakan hubungkan perangkat terlebih dahulu.',
      };
    }

    try {
      this.state.isPrinting = true;
      this.notify();

      const bytes = buildTestPrintEscPos(store, this.state.paperWidth);
      await this.sendData(bytes);

      this.state.isPrinting = false;
      this.state.lastPrintTimestamp = Date.now();
      this.notify();

      return {
        success: true,
        message: `Struk test berhasil dikirim ke printer "${this.state.deviceName}"!`,
      };
    } catch (err: any) {
      this.state.isPrinting = false;
      this.state.error = err.message || 'Gagal mengirim data cetak.';
      this.notify();
      return { success: false, message: `Gagal mencetak: ${err.message}` };
    }
  }

  /**
   * Print completed transaction receipt via connected Bluetooth printer
   */
  public async printTransaction(
    trx: Transaction,
    store: StoreProfile
  ): Promise<{ success: boolean; message: string }> {
    if (!this.state.isConnected || !this.writeCharacteristic) {
      return {
        success: false,
        message: 'Printer Bluetooth belum terhubung. Silakan hubungkan perangkat terlebih dahulu.',
      };
    }

    try {
      this.state.isPrinting = true;
      this.notify();

      const bytes = buildReceiptEscPos(trx, store, this.state.paperWidth);
      await this.sendData(bytes);

      this.state.isPrinting = false;
      this.state.lastPrintTimestamp = Date.now();
      this.notify();

      return {
        success: true,
        message: `Struk transaksi #${trx.orderNumber} berhasil dicetak via Bluetooth!`,
      };
    } catch (err: any) {
      this.state.isPrinting = false;
      this.state.error = err.message || 'Gagal mencetak struk ke printer Bluetooth.';
      this.notify();
      return { success: false, message: `Gagal mencetak: ${err.message}` };
    }
  }

  /**
   * Launch Android RawBT Print App via URL Scheme as fallback
   */
  public printViaRawBT(trx: Transaction, store: StoreProfile): boolean {
    try {
      const bytes = buildReceiptEscPos(trx, store, this.state.paperWidth);
      // Convert Uint8Array to base64
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // RawBT URL scheme
      const rawBtUrl = `rawbt:base64,${base64}`;
      window.location.href = rawBtUrl;
      return true;
    } catch (err) {
      console.error('RawBT print error:', err);
      return false;
    }
  }
}

// Global Singleton Instance
export const bluetoothPrinter = new BluetoothPrinterService();
