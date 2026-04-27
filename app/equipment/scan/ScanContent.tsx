'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

interface ScanResult {
  text: string;
  format: string;
}

interface Machine {
  id: string;
  name: string;
  status: string;
  location?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
}

type ScanMode = 'camera' | 'manual';

export default function BarcodeScanContent() {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError('');
    setError('');
    setScanResult(null);
    setMachine(null);
    setNotFound(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      scanFrames();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permissions and try again.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device. Use manual entry instead.');
      } else {
        setCameraError('Could not start camera. Use manual entry instead.');
      }
    }
  };

  const scanFrames = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);

        // Use BarcodeDetector API if available
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: [
              'code_128', 'code_39', 'code_93', 'codabar',
              'ean_13', 'ean_8', 'upc_a', 'upc_e',
              'qr_code', 'data_matrix', 'pdf417',
            ],
          });

          detector.detect(canvas).then((codes: any[]) => {
            if (codes.length > 0) {
              const code = codes[0];
              handleScanResult({ text: code.rawValue, format: code.format });
            }
          }).catch(() => {});
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanFrames);
  }, []);

  const handleScanResult = async (result: ScanResult) => {
    stopCamera();
    setScanResult(result);
    await lookupMachine(result.text);
  };

  const lookupMachine = async (code: string) => {
    setLoading(true);
    setNotFound(false);
    setMachine(null);
    setError('');

    try {
      // Search machines by serialNumber, part number, or name
      const res = await fetch(`/api/machines?search=${encodeURIComponent(code)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        const machines = data.machines || data.data || [];
        if (machines.length > 0) {
          setMachine(machines[0]);
        } else {
          setNotFound(true);
        }
      } else {
        setError('Failed to look up equipment. Please try again.');
      }
    } catch {
      setError('Lookup failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualInput.trim()) return;
    setScanResult({ text: manualInput.trim(), format: 'manual' });
    await lookupMachine(manualInput.trim());
  };

  const handleReset = () => {
    setScanResult(null);
    setMachine(null);
    setNotFound(false);
    setError('');
    setManualInput('');
    stopCamera();
  };

  const statusColors: Record<string, string> = {
    OPERATIONAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-200',
    DOWN: 'bg-red-50 text-red-700 border-red-200',
    OFFLINE: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/equipment" className="text-[#635bff] hover:underline text-sm">← Equipment</Link>
            <span className="text-[#e6ebf1]">/</span>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Scan Equipment</h1>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">Scan a barcode or QR code to instantly look up equipment details</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Mode toggle */}
        {!scanResult && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setMode('camera'); stopCamera(); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                mode === 'camera' ? 'bg-[#635bff] text-white' : 'bg-white border border-[#e6ebf1] text-[#425466] hover:bg-[#f6f9fc]'
              }`}
            >
              📷 Camera Scan
            </button>
            <button
              onClick={() => { setMode('manual'); stopCamera(); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                mode === 'manual' ? 'bg-[#635bff] text-white' : 'bg-white border border-[#e6ebf1] text-[#425466] hover:bg-[#f6f9fc]'
              }`}
            >
              ⌨️ Manual Entry
            </button>
          </div>
        )}

        {/* Camera mode */}
        {!scanResult && mode === 'camera' && (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Camera Barcode Scanner</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">Point your camera at a barcode, QR code, or equipment sticker</p>
            </div>

            <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
              {!scanning ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="text-6xl">📷</div>
                  <button
                    onClick={startCamera}
                    className="px-6 py-3 bg-[#635bff] text-white font-semibold rounded-lg hover:bg-[#4f46e5] transition-colors"
                  >
                    Start Camera
                  </button>
                  {cameraError && (
                    <p className="text-red-400 text-sm text-center px-6">{cameraError}</p>
                  )}
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {/* Scan guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-40 border-2 border-[#635bff] rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#635bff] rounded-tl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#635bff] rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#635bff] rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#635bff] rounded-br" />
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 opacity-60 animate-pulse" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 inset-x-0 flex justify-center">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-[var(--bg-surface)]/20 text-white text-sm rounded-lg hover:bg-white/30 transition-colors backdrop-blur"
                    >
                      Stop Camera
                    </button>
                  </div>
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Browser compatibility note */}
            {'BarcodeDetector' in window ? null : (
              <div className="p-4 bg-amber-50 border-t border-amber-200">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> Barcode detection works best in Chrome on Android. For iOS or other browsers, use Manual Entry below.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Manual entry mode */}
        {!scanResult && mode === 'manual' && (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6">
            <h2 className="font-semibold text-[var(--text-primary)] mb-1">Manual Part / Serial Lookup</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5">Enter a part number, serial number, or equipment name to look up equipment</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                placeholder="e.g. SN-2024-0042 or Press #3"
                className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#635bff]/30 focus:border-[#635bff]"
                autoFocus
              />
              <button
                onClick={handleManualSearch}
                disabled={!manualInput.trim() || loading}
                className="px-5 py-2.5 bg-[#635bff] text-white text-sm font-semibold rounded-lg hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
              >
                {loading ? '…' : 'Search'}
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>
        )}

        {/* Result display */}
        {scanResult && (
          <div className="space-y-4">
            {/* Scanned code */}
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-0.5">Scanned Code</p>
                <p className="font-mono font-semibold text-[var(--text-primary)]">{scanResult.text}</p>
                {scanResult.format !== 'manual' && (
                  <p className="text-xs text-[var(--text-muted)]">Format: {scanResult.format}</p>
                )}
              </div>
              <button onClick={handleReset} className="text-sm text-[#635bff] hover:underline">Scan again</button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-muted)]">
                Looking up equipment…
              </div>
            )}

            {/* Machine found */}
            {machine && !loading && (
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3 flex items-center gap-2">
                  <span className="text-emerald-600">✅</span>
                  <span className="text-sm font-semibold text-emerald-700">Equipment Found</span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{machine.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColors[machine.status] || 'bg-gray-100 text-gray-600'}`}>
                      {machine.status}
                    </span>
                    {machine.location && (
                      <span className="text-xs text-[var(--text-muted)]">📍 {machine.location}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {machine.serialNumber && (
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Serial Number</p>
                        <p className="text-sm font-mono font-medium text-[var(--text-primary)]">{machine.serialNumber}</p>
                      </div>
                    )}
                    {machine.model && (
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Model</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{machine.model}</p>
                      </div>
                    )}
                    {machine.manufacturer && (
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Manufacturer</p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{machine.manufacturer}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/equipment/${machine.id}`}
                      className="flex-1 text-center bg-[#635bff] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#4f46e5] transition-colors"
                    >
                      View Equipment Details →
                    </Link>
                    <Link
                      href={`/work-orders/new?machineId=${machine.id}`}
                      className="flex-1 text-center border border-[var(--border)] text-[var(--text-secondary)] font-semibold py-2.5 rounded-lg text-sm hover:bg-[var(--bg-page)] transition-colors"
                    >
                      + Create Work Order
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Not found */}
            {notFound && !loading && (
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-2">
                  <span>⚠️</span>
                  <span className="text-sm font-semibold text-amber-700">No Equipment Found</span>
                </div>
                <div className="p-5">
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    No equipment matching <code className="bg-[var(--bg-page)] px-1 rounded font-mono">{scanResult.text}</code> was found in your inventory.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href="/equipment/new"
                      className="px-4 py-2.5 bg-[#635bff] text-white font-semibold rounded-lg text-sm hover:bg-[#4f46e5] transition-colors"
                    >
                      Add New Equipment
                    </Link>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] font-semibold rounded-lg text-sm hover:bg-[var(--bg-page)] transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info box */}
        {!scanResult && (
          <div className="mt-6 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Supported code types</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '📦', label: 'Code 128 / 39', desc: 'Common industrial barcodes' },
                { icon: '🔲', label: 'QR Code', desc: 'Equipment QR stickers' },
                { icon: '📊', label: 'Data Matrix', desc: 'Small equipment labels' },
                { icon: '🔢', label: 'EAN / UPC', desc: 'Parts and components' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-page)]">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
