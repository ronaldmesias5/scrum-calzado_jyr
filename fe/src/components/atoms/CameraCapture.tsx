import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export default function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const [open, setOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setError('');
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      setFacingMode(facing);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `evidence_${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          setOpen(false);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9,
    );
  };

  const toggleCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(next);
  };

  const handleClose = () => {
    setOpen(false);
    stopCamera();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer transition-colors disabled:opacity-50"
      >
        <Camera size={16} />
        Tomar foto
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-bold text-sm">Cámara</h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="relative bg-black aspect-video">
              {error ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex items-center justify-center gap-4 px-4 py-4">
              <button
                onClick={toggleCamera}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors text-white"
                title="Cambiar cámara"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={handleCapture}
                disabled={!!error || !stream}
                className="p-4 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors text-white disabled:opacity-40 shadow-lg shadow-blue-600/30 active:scale-95"
                title="Capturar foto"
              >
                <Camera size={28} />
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
