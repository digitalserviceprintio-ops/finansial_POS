import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ScanLine,
  Camera,
  CameraOff,
  Flashlight,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Zap,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Info,
  Layers,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    formatCurrency,
    showToast,
  } = useApp();

  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanMode, setScanMode] = useState<'auto_add' | 'lookup'>('auto_add');
  const [continuousMode, setContinuousMode] = useState(true);
  const [lastScannedResult, setLastScannedResult] = useState<{
    code: string;
    product?: Product;
    status: 'success' | 'not_found' | 'out_of_stock';
    timestamp: number;
  } | null>(null);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');

  // Audio Beep Effect
  const playBeep = (isSuccess = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isSuccess) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6 note
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
    } catch {
      // Audio playback not allowed or supported
    }
  };

  // Helper to find product by code (matching SKU or ID or exact name substring)
  const findProductByBarcode = (scannedText: string): Product | undefined => {
    const cleanText = scannedText.trim().toLowerCase();
    return products.find(
      (p) =>
        p.sku.toLowerCase() === cleanText ||
        p.id.toLowerCase() === cleanText ||
        p.name.toLowerCase() === cleanText
    );
  };

  // Handle scanned barcode / QR
  const handleBarcodeDecoded = (decodedText: string) => {
    const now = Date.now();
    // Debounce duplicate scans within 1.5 seconds if identical
    if (
      decodedText === lastScannedCodeRef.current &&
      now - lastScannedTimeRef.current < 1500
    ) {
      return;
    }

    lastScannedCodeRef.current = decodedText;
    lastScannedTimeRef.current = now;

    const matchedProduct = findProductByBarcode(decodedText);

    if (matchedProduct) {
      if (matchedProduct.stock <= 0 || !matchedProduct.isAvailable) {
        playBeep(false);
        setLastScannedResult({
          code: decodedText,
          product: matchedProduct,
          status: 'out_of_stock',
          timestamp: now,
        });
        showToast(`Produk "${matchedProduct.name}" stok habis!`, 'warning');
      } else {
        playBeep(true);
        if (scanMode === 'auto_add') {
          addToCart(matchedProduct);
          showToast(`+1 ${matchedProduct.name} (${matchedProduct.sku}) masuk keranjang`, 'success');
        } else {
          showToast(`Info Produk: ${matchedProduct.name} - ${formatCurrency(matchedProduct.sellingPrice)}`, 'info');
        }

        setLastScannedResult({
          code: decodedText,
          product: matchedProduct,
          status: 'success',
          timestamp: now,
        });

        if (!continuousMode && scanMode === 'auto_add') {
          setTimeout(() => {
            onClose();
          }, 600);
        }
      }
    } else {
      playBeep(false);
      setLastScannedResult({
        code: decodedText,
        status: 'not_found',
        timestamp: now,
      });
      showToast(`Barcode "${decodedText}" tidak cocok dengan produk manapun`, 'warning');
    }
  };

  // Start the camera scanner
  const startScanner = async () => {
    setCameraError(null);
    try {
      const elementId = 'qr-reader-container';
      const container = document.getElementById(elementId);
      if (!container) return;

      // Stop any existing instance
      if (html5QrCodeRef.current && isScanningRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch {
          // ignore
        }
        isScanningRef.current = false;
      }

      const html5QrCode = new Html5Qrcode(elementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = html5QrCode;

      // Get available cameras
      try {
        const availableDevices = await Html5Qrcode.getCameras();
        if (availableDevices && availableDevices.length > 0) {
          setCameras(availableDevices);
          if (!selectedCameraId) {
            // Prefer back camera if found
            const backCam = availableDevices.find((d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('belakang') ||
              d.label.toLowerCase().includes('environment')
            );
            setSelectedCameraId(backCam ? backCam.id : availableDevices[0].id);
          }
        }
      } catch {
        // Camera enumeration might fail if permissions not granted yet
      }

      const cameraConfig = selectedCameraId
        ? { deviceId: { exact: selectedCameraId } }
        : { facingMode: facingMode };

      const qrConfig = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          return {
            width: Math.floor(minDim * 0.88),
            height: Math.floor(minDim * 0.55),
          };
        },
        aspectRatio: 1.333,
      };

      await html5QrCode.start(
        cameraConfig,
        qrConfig,
        (decodedText) => {
          handleBarcodeDecoded(decodedText);
        },
        () => {
          // ignore frames without barcodes
        }
      );

      isScanningRef.current = true;
      setScannerActive(true);

      // Check if torch/flashlight is supported
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
        if (capabilities && capabilities.torchFeature().isSupported()) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: unknown) {
      console.warn('Barcode camera scanner error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('Izin akses kamera belum diizinkan. Silakan berikan izin kamera pada browser Anda.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('Kamera tidak terdeteksi pada perangkat ini.');
      } else {
        setCameraError('Gagal menghubungkan kamera. Anda dapat menggunakan uji barcode manual di bawah.');
      }
      setScannerActive(false);
      isScanningRef.current = false;
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanningRef.current || !hasTorch) return;
    try {
      const capabilities = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
      const torchFeature = capabilities.torchFeature();
      const nextState = !isTorchOn;
      await torchFeature.apply(nextState);
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      isScanningRef.current = false;
      setScannerActive(false);
      setIsTorchOn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        startScanner();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
      setLastScannedResult(null);
    }
  }, [isOpen, selectedCameraId, facingMode]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    handleBarcodeDecoded(manualCodeInput);
    setManualCodeInput('');
  };

  // Sample SKU tags for rapid 1-click testing
  const sampleSkus = products.slice(0, 8);

  const matchedProductInCart = lastScannedResult?.product
    ? cart.find((item) => item.product.id === lastScannedResult.product?.id)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e2e1ec] bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f3f2fa]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebeaff] text-[#4648d4]">
              <ScanLine className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1b23] flex items-center gap-2">
                <span>Scan Barcode Kamera POS</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live Scanner
                </span>
              </h3>
              <p className="text-xs text-[#767680]">Arahkan kamera perangkat ke barcode produk atau SKU</p>
            </div>
          </div>
          <button
            id="close-scanner-modal-btn"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#767680] hover:bg-[#f3f2fa] hover:text-[#1b1b23] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tab */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#f3f2fa] border border-[#e2e1ec]">
          <button
            id="btn-mode-auto-add"
            type="button"
            onClick={() => setScanMode('auto_add')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scanMode === 'auto_add'
                ? 'bg-white text-[#4648d4] shadow-xs'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Auto +1 Keranjang</span>
          </button>
          <button
            id="btn-mode-lookup"
            type="button"
            onClick={() => setScanMode('lookup')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              scanMode === 'lookup'
                ? 'bg-white text-[#4648d4] shadow-xs'
                : 'text-[#767680] hover:text-[#1b1b23]'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Cek Info & Stok</span>
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border-2 border-[#4648d4]/30 shadow-inner flex flex-col items-center justify-center min-h-[260px] sm:min-h-[290px]">
          {/* HTML5 QR Container */}
          <div
            id="qr-reader-container"
            className="w-full h-full overflow-hidden [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:rounded-2xl"
          />

          {/* Custom Overlay Scanning Target (Laser animation & Reticle) */}
          {scannerActive && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* Semi-dark mask around scanner box */}
              <div className="relative w-64 sm:w-72 h-36 sm:h-40 rounded-xl border-2 border-[#4648d4] shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                {/* 4 Corner Markers */}
                <div className="absolute -top-1 -left-1 h-5 w-5 border-t-4 border-l-4 border-white rounded-tl-sm"></div>
                <div className="absolute -top-1 -right-1 h-5 w-5 border-t-4 border-r-4 border-white rounded-tr-sm"></div>
                <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-4 border-l-4 border-white rounded-bl-sm"></div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-4 border-r-4 border-white rounded-br-sm"></div>

                {/* Animated Red/Cyan Laser Scan Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-bounce duration-1000 top-1/2 -translate-y-1/2"></div>

                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white tracking-wide backdrop-blur-xs">
                    Posisikan barcode di dalam kotak
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Camera Error or Loading state */}
          {cameraError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-neutral-900/95 text-white space-y-3">
              <CameraOff className="h-10 w-10 text-amber-400" />
              <p className="text-xs font-semibold max-w-xs">{cameraError}</p>
              <div className="flex gap-2">
                <button
                  onClick={startScanner}
                  className="flex items-center gap-1.5 rounded-xl bg-[#4648d4] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#3435ad] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Coba Lagi</span>
                </button>
              </div>
            </div>
          )}

          {/* Overlay Quick Control Bar */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-xl bg-black/50 p-1 backdrop-blur-md">
            {/* Torch Flashlight Toggle */}
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isTorchOn ? 'text-amber-300 bg-amber-400/20' : 'text-neutral-400 hover:text-white'
                }`}
                title={isTorchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
              >
                <Flashlight className="h-4 w-4" />
              </button>
            )}

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                soundEnabled ? 'text-white bg-white/20' : 'text-neutral-400 hover:text-white'
              }`}
              title={soundEnabled ? 'Suara Beep Aktif' : 'Suara Beep Nonaktif'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Camera switch if multiple */}
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const nextIndex =
                    (cameras.findIndex((c) => c.id === selectedCameraId) + 1) % cameras.length;
                  setSelectedCameraId(cameras[nextIndex].id);
                }}
                className="p-1.5 rounded-lg text-xs text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Ganti Kamera"
              >
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Feedback Card from Scanned Result */}
        {lastScannedResult && (
          <div
            className={`p-3.5 rounded-2xl border transition-all animate-in zoom-in-95 duration-150 ${
              lastScannedResult.status === 'success'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : lastScannedResult.status === 'out_of_stock'
                ? 'bg-red-50/80 border-red-200 text-red-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {lastScannedResult.product ? (
                <img
                  src={lastScannedResult.product.image}
                  alt={lastScannedResult.product.name}
                  className="h-12 w-12 rounded-xl object-cover border border-black/10 shrink-0 bg-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold truncate">
                    {lastScannedResult.product
                      ? lastScannedResult.product.name
                      : `Kode: ${lastScannedResult.code}`}
                  </p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 shrink-0">
                    {lastScannedResult.product?.sku || 'Unrecognized'}
                  </span>
                </div>

                {lastScannedResult.product && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-[#4648d4]">
                        {formatCurrency(lastScannedResult.product.sellingPrice)}
                      </span>
                      <span className="text-[11px] text-[#767680] ml-2">
                        Stok: {lastScannedResult.product.stock} {lastScannedResult.product.unit || 'pcs'}
                      </span>
                    </div>

                    {/* Direct Cart Controls in Scanned Card */}
                    <div className="flex items-center gap-1.5">
                      {matchedProductInCart ? (
                        <div className="flex items-center gap-1 bg-white border border-[#d2d1dc] rounded-lg px-1.5 py-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => removeFromCart(lastScannedResult.product!.id)}
                            className="p-1 text-[#767680] hover:text-red-600 rounded"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold px-1 text-[#1b1b23]">
                            {matchedProductInCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCart(lastScannedResult.product!)}
                            disabled={matchedProductInCart.quantity >= lastScannedResult.product!.stock}
                            className="p-1 text-[#4648d4] hover:text-[#3435ad] disabled:opacity-30 rounded"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(lastScannedResult.product!);
                            playBeep(true);
                            showToast(`+1 ${lastScannedResult.product!.name} masuk keranjang`, 'success');
                          }}
                          disabled={lastScannedResult.product.stock <= 0}
                          className="flex items-center gap-1 rounded-lg bg-[#4648d4] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-[#3435ad] disabled:opacity-40 transition-all cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>+ Keranjang</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {lastScannedResult.status === 'out_of_stock' && (
                  <p className="text-[11px] font-bold text-red-700 mt-1">
                    Stok produk ini sedang habis di gudang/etalase.
                  </p>
                )}

                {lastScannedResult.status === 'not_found' && (
                  <p className="text-[11px] text-amber-800 mt-1">
                    Tidak ditemukan produk terdaftar dengan SKU/Kode ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan Settings Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fcf8ff] border border-[#e2e1ec] text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="h-4 w-4 rounded text-[#4648d4] focus:ring-[#4648d4]"
            />
            <span className="font-bold text-[#1b1b23]">Scan Berulang (Multi-Item)</span>
          </label>
          <span className="text-[11px] text-[#767680]">
            {continuousMode ? 'Tetap buka untuk scan banyak' : 'Tutup otomatis setelah 1 scan'}
          </span>
        </div>

        {/* Manual Barcode / SKU Input */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="block text-xs font-bold text-[#1b1b23]">
            Input Barcode / SKU Manual (Keyboard / Scanner Gun):
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#767680]" />
              <input
                id="manual-barcode-input"
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value)}
                placeholder="Ketik SKU (cth: MKN-001, MNM-001)..."
                className="w-full rounded-xl border border-[#d2d1dc] bg-[#fcf8ff] py-2 pl-9 pr-3 text-xs text-[#1b1b23] focus:border-[#4648d4] focus:bg-white focus:outline-none"
              />
            </div>
            <button
              id="btn-submit-manual-barcode"
              type="submit"
              disabled={!manualCodeInput.trim()}
              className="rounded-xl bg-[#4648d4] px-4 py-2 text-xs font-bold text-white hover:bg-[#3435ad] disabled:opacity-50 transition-all cursor-pointer"
            >
              Lookup
            </button>
          </div>
        </form>

        {/* Rapid Test Barcode Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#767680]">
            <Zap className="h-3 w-3 text-amber-500" />
            <span>Klik Cepat Uji Coba SKU:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleSkus.map((p) => (
              <button
                key={p.id}
                id={`chip-test-sku-${p.sku}`}
                type="button"
                onClick={() => handleBarcodeDecoded(p.sku)}
                className="rounded-lg border border-[#e2e1ec] bg-[#fcf8ff] px-2.5 py-1 text-[11px] font-mono font-semibold text-[#46464f] hover:border-[#4648d4] hover:bg-[#ebeaff] hover:text-[#4648d4] transition-colors cursor-pointer"
              >
                {p.sku} ({p.name})
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-[#f3f2fa] flex items-center justify-between">
          <div className="text-[11px] text-[#767680]">
            Total di keranjang: <span className="font-bold text-[#1b1b23]">{cart.reduce((a, b) => a + b.quantity, 0)} item</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#e2e1ec] bg-[#fcf8ff] px-5 py-2.5 text-xs font-bold text-[#46464f] hover:bg-[#f3f2fa] transition-all cursor-pointer"
          >
            Selesai / Tutup Scanner
          </button>
        </div>
      </div>
    </div>
  );
};

