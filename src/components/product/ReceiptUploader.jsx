import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, ScanLine, Camera, SwitchCamera, XCircle } from "lucide-react";
import { useOCR } from "../../hooks/useOCR";

export function ReceiptUploader({ onExtracted, onFileSelected }) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);
  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);
  const { processImage, isProcessing } = useOCR();

  function handleFile(file) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileSelected?.(file);
    processImage(file).then((data) => { if (data) onExtracted?.(data); });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function clearFile(e) {
    e.stopPropagation();
    setPreview(null);
    onFileSelected?.(null);
    fileInputRef.current.value = "";
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCameraError(null);
  }, []);

  const startCamera = useCallback(async (facing) => {
    setCameraError(null);
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permission and try again."
          : "Could not access camera. Make sure your device has a camera."
      );
    }
  }, []);

  async function openCamera() {
    setCameraOpen(true);
    // Small delay to let the video element mount
    setTimeout(() => startCamera(facingMode), 100);
  }

  function switchCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `invoice-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      stopCamera();
      handleFile(file);
    }, "image/jpeg", 0.92);
  }

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Invoice / Receipt{" "}
        <span className="text-slate-600 font-normal text-xs">(optional — OCR auto-fills fields)</span>
      </label>

      {/* Camera viewfinder */}
      {cameraOpen && (
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ backgroundColor: "#000", border: "2px solid rgba(124,58,237,0.3)" }}
        >
          {cameraError ? (
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <XCircle size={36} className="text-red-400" />
              <p className="text-sm text-red-300">{cameraError}</p>
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl text-sm text-white"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-2xl"
                style={{ maxHeight: "360px", objectFit: "cover" }}
              />
              {/* Camera controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}
              >
                <button
                  onClick={stopCamera}
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                  title="Cancel"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={capturePhoto}
                  className="h-16 w-16 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, var(--accent), #a78bfa)",
                    border: "3px solid rgba(255,255,255,0.8)",
                    boxShadow: "var(--glow)",
                  }}
                  title="Capture photo"
                >
                  <Camera size={26} className="text-white" />
                </button>
                <button
                  onClick={switchCamera}
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                  title="Switch camera"
                >
                  <SwitchCamera size={18} />
                </button>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Upload area + Camera button (hidden when camera is open) */}
      {!cameraOpen && (
        <div className="flex gap-3">
          {/* Drag-drop upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200"
            style={{
              border: `2px dashed ${dragActive ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
              backgroundColor: dragActive ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)",
            }}
            onMouseEnter={(e) => { if (!dragActive) e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; }}
            onMouseLeave={(e) => { if (!dragActive) e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
          >
            {preview ? (
              <div className="relative inline-block">
                <img src={preview} alt="Receipt" className="max-h-44 rounded-xl mx-auto" />
                <button
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <>
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  <Upload size={24} style={{ color: "var(--accent-light)" }} />
                </div>
                <p className="text-sm text-slate-400">Drop invoice here or <span style={{ color: "var(--accent-light)" }}>click to upload</span></p>
                <p className="text-xs text-slate-600 mt-1">JPG, PNG, PDF up to 10MB</p>
              </>
            )}
          </div>

          {/* Camera capture button */}
          {!preview && (
            <button
              type="button"
              onClick={openCamera}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl px-5 transition-all duration-200"
              style={{
                border: "2px dashed rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.02)",
                minWidth: "110px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"; e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"; }}
            >
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <Camera size={24} style={{ color: "var(--accent-light)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--accent-light)" }}>Take Photo</p>
            </button>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />

      {isProcessing && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <ScanLine size={15} style={{ color: "var(--accent-light)" }} className="animate-pulse" />
          <span style={{ color: "var(--accent-light)" }}>Scanning receipt with OCR...</span>
        </div>
      )}
    </div>
  );
}
