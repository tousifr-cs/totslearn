import { useRef, useState, useEffect, useCallback } from "react";
import { Trash2, Download } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = [
  "#1a1a1a", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff", "#a3a3a3",
  "#92400e", "#164e63"
];

const STEPS = [
  { label: "Draw a big circle for the head", emoji: "⭕", hint: "Make a large round circle in the middle" },
  { label: "Add two pointy ears on top", emoji: "👂", hint: "Draw two triangles at the top of the circle" },
  { label: "Draw two eyes inside", emoji: "👀", hint: "Add two small circles or ovals for eyes" },
  { label: "Add a tiny nose", emoji: "👃", hint: "Draw a small triangle or dot in the center" },
  { label: "Draw a curved mouth and whiskers", emoji: "😺", hint: "Add a W-shape mouth and long lines for whiskers" },
  { label: "Add the body and tail", emoji: "🐈", hint: "Draw a rounded rectangle below and a curved tail" },
  { label: "Color your cat!", emoji: "🎨", hint: "Choose any color and fill in your cat" },
];

export default function DrawACatGame({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#1a1a1a");
  const [brushSize, setBrushSize] = useState(6);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fffbf5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    lastPos.current = pos;
  }, [isDrawing, color, brushSize]);

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fffbf5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "my-cat.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleFinish = () => {
    setDone(true);
    onComplete();
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">🐱</motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Amazing Art!</h2>
        <p className="text-xl text-muted-foreground">Your cat is purr-fect!</p>
        <div className="flex gap-3">
          <button onClick={downloadDrawing} className="px-6 py-3 bg-green-500 text-white rounded-full font-bold shadow-lg flex items-center gap-2">
            <Download className="w-5 h-5" /> Save
          </button>
          <button onClick={() => { clearCanvas(); setStep(0); setDone(false); }}
            className="px-6 py-3 bg-primary text-white rounded-full font-bold shadow-lg">
            Draw Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row h-full gap-4">
      {/* Guide panel */}
      <div className="sm:w-56 shrink-0 flex flex-col gap-3">
        <h3 className="font-display text-lg font-black text-foreground">Steps:</h3>
        <div className="space-y-2 overflow-y-auto flex-1">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-start gap-2
                ${step === i ? "bg-primary text-white shadow-lg" : i < step ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}
              `}
            >
              <span className="text-lg shrink-0">{s.emoji}</span>
              <span className="leading-tight">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-accent/10 rounded-2xl p-3">
          <p className="text-xs font-bold text-accent mb-1">Tip:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{STEPS[step].hint}</p>
        </div>

        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => Math.min(s + 1, STEPS.length - 1))}
            className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm shadow">
            Next Step →
          </button>
        ) : (
          <button onClick={handleFinish}
            className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-sm shadow">
            I'm Done! 🎉
          </button>
        )}
      </div>

      {/* Drawing area */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {/* Colors */}
          <div className="flex gap-1 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-125 shadow-md" : "border-white"}`}
              />
            ))}
          </div>

          {/* Brush size */}
          <div className="flex items-center gap-2 ml-auto">
            {[3, 6, 12, 20].map(s => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                className={`flex items-center justify-center rounded-full bg-white border-2 transition-all
                  ${brushSize === s ? "border-primary scale-110" : "border-muted"}
                `}
                style={{ width: s + 16, height: s + 16 }}
              >
                <div className="rounded-full bg-foreground" style={{ width: s, height: s }} />
              </button>
            ))}
          </div>

          <button onClick={clearCanvas} className="p-2 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-all">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={downloadDrawing} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-[#fffbf5]">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="w-full h-full touch-none cursor-crosshair"
            style={{ cursor: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize + 4}' height='${brushSize + 4}' viewBox='0 0 ${brushSize + 4} ${brushSize + 4}'><circle cx='${(brushSize + 4) / 2}' cy='${(brushSize + 4) / 2}' r='${brushSize / 2}' fill='${encodeURIComponent(color)}'/></svg>") ${(brushSize + 4) / 2} ${(brushSize + 4) / 2}, crosshair` }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
      </div>
    </div>
  );
}
