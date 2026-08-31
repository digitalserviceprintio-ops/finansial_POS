import { Transaction, StoreProfile } from '../types';
import { buildReceiptEscPos, buildTestPrintEscPos, PaperWidth } from './escpos';

// Comprehensive Bluetooth Thermal Printer Service UUIDs
// Covering standard POS, Chinese generic (ISSC, HM-10, Telink, Xprinter, Panda, Goojprt), Nordic UART, etc.
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 / Goojprt / Panda BLE Serial
  '0000ffe5-0000-1000-8000-00805f9b34fb', // HM-10 variant
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC transparent UART (Common in POS-58 / MPT-II)
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic Chinese Thermal Printer 0xFF00
  '0000fff0-0000-1000-8000-00805f9b34fb', // Generic Chinese Thermal Printer 0xFFF0
  '0000fee7-0000-1000-8000-00805f9b34fb', // Tencent / Chinese POS
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // PosPrinter / RPP
  '0000e781-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb', // Xprinter / Zhuhai UART
  '0000ae30-0000-1000-8000-00805f9b34fb', // Xprinter variant
  '0000af30-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic Semiconductor UART Service
  '0000fe00-0000-1000-8000-00805f9b34fb',
  '0000ff80-0000-1000-8000-00805f9b34fb',
  '0000fef5-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb', // Generic Access
  '00001801-0000-1000-8000-00805f9b34fb', // Generic Attribute
];

export interface BluetoothPrinterState {
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  deviceName: string | null;
  deviceId: string | null;
  error: string | null;
  errorCode?: 'IFRAME_BLOCKED' | 'NOT_SUPPORTED' | 'USER_CANCELLED' | 'GATT_ERROR' | 'NO_CHARACTERISTIC' | 'OTHER';
  paperWidth: PaperWidth;
  autoPrintOnCheckout: boolean;
  lastPrintTimestamp: number | null;
}

export interface BluetoothDiagnostic {
  isSupported: boolean;
  isSecureContext: boolean;
  isInIframe: boolean;
  browserName: string;
  isAndroid: boolean;
  isIOS: boolean;
  recommendation: string;
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

  public isInIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  public getDiagnostics(): BluetoothDiagnostic {
    const isSupported = this.isBluetoothSupported();
    const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;
    const inIframe = this.isInIframe();

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    let browserName = 'Browser Lain';
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua) && !/OPR/i.test(ua)) browserName = 'Google Chrome';
    else if (/Edg/i.test(ua)) browserName = 'Microsoft Edge';
    else if (/SamsungBrowser/i.test(ua)) browserName = 'Samsung Internet';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Apple Safari';
    else if (/Firefox/i.test(ua)) browserName = 'Mozilla Firefox';

    let recommendation = 'Koneksi Web Bluetooth siap digunakan.';
    if (inIframe) {
      recommendation =
        'Aplikasi berjalan di dalam frame pratinjau. Klik "Buka di Tab Baru" untuk mengizinkan pairing Bluetooth.';
    } else if (isIOS) {
      recommendation =
        'Safari di iOS belum mendukung Web Bluetooth secara langsung. Gunakan dialog cetak browser atau browser Bluefy di iOS.';
    } else if (!isSupported) {
      recommendation =
        'Gunakan browser Google Chrome / Microsoft Edge di Android atau PC untuk menghubungkan printer Bluetooth.';
    }

    return {
      isSupported,
      isSecureContext,
      isInIframe: inIframe,
      browserName,
      isAndroid,
      isIOS,
      recommendation,
    };
  }

  /**
   * Request user to pair and connect to a Bluetooth thermal printer
   */
  public async connect(): Promise<{ success: boolean; message: string; errorCode?: string }> {
    // 1. Check iframe restriction
    if (this.isInIframe()) {
      const errMsg =
        'Web Bluetooth diblokir di dalam pratinjau iframe oleh browser. Harap buka aplikasi di Tab Baru untuk melakukan pairing Bluetooth.';
      this.state.error = errMsg;
      this.state.errorCode = 'IFRAME_BLOCKED';
      this.notify();
      return { success: false, message: errMsg, errorCode: 'IFRAME_BLOCKED' };
    }

    // 2. Check Web Bluetooth support
    if (!this.isBluetoothSupported()) {
      const diag = this.getDiagnostics();
      let errMsg =
        'Browser ini belum mendukung Web Bluetooth API secara langsung. Gunakan Chrome/Edge di Android/Windows, atau gunakan opsi RawBT / Dialog Cetak.';
      if (diag.isIOS) {
        errMsg =
          'iOS Safari tidak mendukung Web Bluetooth. Anda dapat mencetak struk menggunakan opsi "Dialog Cetak Sistem (AirPrint / Printer Driver)".';
      }
      this.state.error = errMsg;
      this.state.errorCode = 'NOT_SUPPORTED';
      this.notify();
      return { success: false, message: errMsg, errorCode: 'NOT_SUPPORTED' };
    }

    try {
      this.state.isConnecting = true;
      this.state.error = null;
      this.state.errorCode = undefined;
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
      this.state.deviceName = device.name || 'Printer Bluetooth ESC/POS';
      this.state.deviceId = device.id;

      // Handle disconnection event
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnect();
      });

      // Connect GATT Server with timeout
      const server = await device.gatt.connect();
      this.gattServer = server;

      // Locate writable characteristic
      const char = await this.findWriteCharacteristic(server);
      if (!char) {
        throw new Error(
          'Tidak dapat menemukan characteristic data thermal printer pada perangkat ini. Pastikan printer mendukung BLE (Bluetooth Low Energy) atau gunakan aplikasi RawBT.'
        );
      }

      this.writeCharacteristic = char;
      this.state.isConnected = true;
      this.state.isConnecting = false;
      this.state.error = null;
      this.state.errorCode = undefined;
      this.notify();

      return {
        success: true,
        message: `Berhasil terhubung ke printer Bluetooth: ${this.state.deviceName}`,
      };
    } catch (err: any) {
      console.warn('Bluetooth connection error:', err);
      this.state.isConnected = false;
      this.state.isConnecting = false;

      let userMsg = err.message || 'Gagal menghubungkan printer Bluetooth.';
      let errCode: BluetoothPrinterState['errorCode'] = 'OTHER';

      if (err.name === 'SecurityError' || String(err).includes('Permissions policy') || String(err).includes('disallowed')) {
        userMsg = 'Akses Bluetooth dibatasi oleh izin browser (Iframe). Silakan buka aplikasi di Tab Baru.';
        errCode = 'IFRAME_BLOCKED';
      } else if (err.name === 'NotFoundError' || String(err).includes('User cancelled') || String(err).includes('cancelled')) {
        userMsg = 'Pencarian dibatalkan atau tidak ada printer yang dipilih.';
        errCode = 'USER_CANCELLED';
      } else if (err.name === 'NetworkError' || String(err).includes('GATT')) {
        userMsg =
          'Gagal menyambung ke GATT Server printer. Pastikan printer menyala, baterai cukup, dan tidak sedang terhubung ke perangkat/HP lain. Coba matikan lalu nyalakan kembali printer.';
        errCode = 'GATT_ERROR';
      } else if (String(err).includes('characteristic')) {
        userMsg =
          'Printer terhubung tetapi protokol komunikasi tidak cocok (kemungkinan Bluetooth Classic 2.0 / SPP). Gunakan opsi Cetak RawBT atau Dialog Driver Sistem.';
        errCode = 'NO_CHARACTERISTIC';
      }

      this.state.error = userMsg;
      this.state.errorCode = errCode;
      this.notify();
      return { success: false, message: userMsg, errorCode: errCode };
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
    // 1. Try iterating through all primary services
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
      // Primary services scan might be restricted, fallback to direct known UUID lookups
    }

    // 2. Fallback to querying known printer service UUIDs directly
    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        if (service) {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              return char;
            }
          }
        }
      } catch {
        // continue
      }
    }

    return null;
  }

  /**
   * Send binary data in small chunks (e.g. 64-100 bytes) with a small delay to avoid buffer overflow
   */
  public async sendData(data: Uint8Array): Promise<boolean> {
    if (!this.writeCharacteristic) {
      throw new Error('Printer Bluetooth belum terhubung.');
    }

    const chunkSize = 64; // safe MTU size for all thermal printer brands
    const totalChunks = Math.ceil(data.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      const chunk = data.slice(start, end);

      try {
        if (this.writeCharacteristic.writeValueWithoutResponse) {
          await this.writeCharacteristic.writeValueWithoutResponse(chunk);
        } else if (this.writeCharacteristic.writeValue) {
          await this.writeCharacteristic.writeValue(chunk);
        }
      } catch (writeErr) {
        // Retry with standard writeValue if writeWithoutResponse failed
        if (this.writeCharacteristic.writeValue) {
          await this.writeCharacteristic.writeValue(chunk);
        } else {
          throw writeErr;
        }
      }

      // Small pause between chunks to give printer buffer time to process
      if (i < totalChunks - 1) {
        await new Promise((resolve) => setTimeout(resolve, 30));
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

  /**
   * Test print via RawBT App
   */
  public printTestViaRawBT(store: StoreProfile): boolean {
    try {
      const bytes = buildTestPrintEscPos(store, this.state.paperWidth);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      window.location.href = `rawbt:base64,${base64}`;
      return true;
    } catch (err) {
      console.error('RawBT test print error:', err);
      return false;
    }
  }
}

// Global Singleton Instance
export const bluetoothPrinter = new BluetoothPrinterService();

