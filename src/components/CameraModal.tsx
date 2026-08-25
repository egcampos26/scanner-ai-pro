import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Não foi possível acessar a câmera. Verifique as permissões de vídeo do seu navegador.');
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopCamera();
      onCapture(dataUrl);
      onClose();
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#0A0A0A] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-[#111111] border-b border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-white">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-[#00FF88]">
              <Camera className="w-4 h-4" />
            </div>
            <span className="font-mono font-bold text-sm text-white uppercase tracking-wider">Scanner com Câmera</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-white/70 max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-white mb-2">{error}</p>
              <p className="text-xs font-mono text-white/40">Você também pode enviar uma foto ou PDF diretamente do seu computador.</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Document Alignment Frame Guide - HUD Style */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-[#00FF88]/50 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                {/* HUD Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FF88]" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#00FF88]" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#00FF88]" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#00FF88]" />

                <div className="flex justify-between text-[10px] font-mono text-[#00FF88] uppercase tracking-wider drop-shadow">
                  <span>[ CANTO SUPERIOR ]</span>
                  <span>[ ENQUADRE O PAPEL ]</span>
                </div>
                <div className="text-center text-xs font-mono text-white/90 bg-black/60 py-1 px-4 rounded-full mx-auto backdrop-blur-xs border border-white/10">
                  Mantenha o documento paralelo e plano
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[#00FF88] uppercase tracking-wider drop-shadow">
                  <span>[ MODO CAMSCANNER ]</span>
                  <span>[ OCR 100% PRECISO ]</span>
                </div>
              </div>
            </>
          )}

          {isInitializing && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[#00FF88] font-mono text-xs uppercase tracking-wider">
              Iniciando sensor óptico...
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#111111] border-t border-white/10 flex items-center justify-between">
          <button
            onClick={toggleCamera}
            className="px-3.5 py-2 text-xs font-mono text-white/70 hover:text-white bg-[#1A1A1A] hover:bg-[#242424] border border-white/10 rounded-lg flex items-center gap-1.5 transition-colors uppercase"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Alternar Câmera</span>
          </button>

          <button
            disabled={!!error || isInitializing}
            onClick={handleCapture}
            className="px-7 py-2.5 bg-[#00FF88] hover:bg-[#00FF88]/90 disabled:opacity-40 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(0,255,136,0.4)] flex items-center gap-2 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 text-black" />
            <span>Capturar Foto</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-white/40 hover:text-white uppercase transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
