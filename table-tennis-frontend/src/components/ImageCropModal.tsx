import React, { useState, useRef, useEffect } from "react";
import { XMarkIcon, CheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  aspectRatio?: number; // width / height, e.g. 3/4 = 0.75
  targetWidth?: number;
  targetHeight?: number;
  onCropComplete: (file: File) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  aspectRatio = 3 / 4,
  targetWidth = 900,
  targetHeight = 1200,
  onCropComplete,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset transform when new image opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!imgRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Fill background
      ctx.fillStyle = "#061D23";
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const img = imgRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();

      // Ratio between canvas and visual preview container
      const scaleFactor = targetWidth / containerRect.width;

      // Calculate where the image is inside the container
      const relativeX = (imgRect.left - containerRect.left) * scaleFactor;
      const relativeY = (imgRect.top - containerRect.top) * scaleFactor;
      const drawnWidth = imgRect.width * scaleFactor;
      const drawnHeight = imgRect.height * scaleFactor;

      ctx.drawImage(img, relativeX, relativeY, drawnWidth, drawnHeight);

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            const file = new File([blob], `cropped-poster-${Date.now()}.webp`, {
              type: "image/webp",
            });
            onCropComplete(file);
            onClose();
          }
        },
        "image/webp",
        0.88
      );
    } catch (err) {
      console.error("Crop error:", err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#061D23] p-5 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4AEEFF]" />
              Crop & Position Poster
            </h3>
            <p className="text-xs text-white/60">
              Drag to reposition • Use slider to zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Crop Frame Area */}
        <div className="my-4 flex justify-center items-center">
          <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-[#4AEEFF]/60 bg-black/50 cursor-grab active:cursor-grabbing select-none"
            style={{
              width: "280px",
              height: `${280 / aspectRatio}px`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                maxWidth: "none",
                maxHeight: "none",
                width: "100%",
                height: "auto",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              className="pointer-events-none transition-transform duration-75"
            />

            {/* Subtle grid lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/10">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3 px-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-white/70 w-12">Zoom</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#4AEEFF]"
            />
            <span className="text-xs text-mono text-[#4AEEFF] w-10 text-right">
              {scale.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 pt-1">
            <button
              type="button"
              onClick={() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className="inline-flex items-center gap-1 hover:text-[#4AEEFF] transition-colors"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Reset Framing
            </button>
            <span>Target ratio: 3:4 portrait</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#061D23] bg-[#4AEEFF] hover:bg-[#35efff] rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckIcon className="w-4 h-4" />
            {isProcessing ? "Optimizing…" : "Use Cropped Image"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;

