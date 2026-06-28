import { useEffect, useRef } from "react";
import { Badge } from "./ui/badge";

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  cover: HTMLElement,
  id: string,
): void {
  const W = cover.offsetWidth;
  const H = cover.offsetHeight;
  const dpr = window.devicePixelRatio || 1;

  // set actual pixel dimensions
  canvas.width = W * dpr;
  canvas.height = H * dpr;

  // keep CSS size the same
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.scale(dpr, dpr);
  const rand = seededRand(hashId(id));

  const CELL = Math.round(W / 14);
  const cols = Math.ceil(W / CELL) + 1;
  const rows = Math.ceil(H / CELL) + 1;

  ctx.clearRect(0, 0, W, H);

  // random filled cells
  const cellCount = 10 + Math.floor(rand() * 8);
  for (let i = 0; i < cellCount; i++) {
    const c = Math.floor(rand() * cols);
    const r = Math.floor(rand() * rows);
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
  }

  // grid lines
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL, 0);
    ctx.lineTo(c * CELL, H);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL);
    ctx.lineTo(W, r * CELL);
    ctx.stroke();
  }

  function hBeam(x1: number, x2: number, y: number, color: string): void {
    if (!ctx) return;
    const grad = ctx.createLinearGradient(x1, y, x2, y);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  function vBeam(x: number, y1: number, y2: number, color: string): void {
    if (!ctx) return;
    const grad = ctx.createLinearGradient(x, y1, x, y2);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }

  function lBeam(
    cornerX: number,
    cornerY: number,
    hLen: number,
    vLen: number,
    dir: "right" | "left",
    color: string,
  ): void {
    if (!ctx) return;

    const hx1 = dir === "right" ? cornerX - hLen : cornerX;
    const hx2 = dir === "right" ? cornerX : cornerX + hLen;

    const hGrad = ctx.createLinearGradient(hx1, cornerY, hx2, cornerY);
    hGrad.addColorStop(0, "transparent");
    hGrad.addColorStop(1, color);
    ctx.strokeStyle = hGrad;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(hx1, cornerY);
    ctx.lineTo(hx2, cornerY);
    ctx.stroke();

    const vGrad = ctx.createLinearGradient(
      cornerX,
      cornerY,
      cornerX,
      cornerY + vLen,
    );
    vGrad.addColorStop(0, color);
    vGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = vGrad;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY);
    ctx.lineTo(cornerX, cornerY + vLen);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cornerX, cornerY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const beamColors = [
    "rgba(255,255,255,0.35)",
    "rgba(194,194,194,0.6)",
    "rgba(194,194,194,0.4)",
    "rgba(194,194,194,0.3)",
    "rgba(255,255,255,0.5)",
    "rgba(255,255,255,0.3)",
  ];

  const pick = () => beamColors[Math.floor(rand() * beamColors.length)];
  const rc = (max: number) => Math.floor(rand() * max);

  // random hBeams
  const hCount = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < hCount; i++) {
    const x1 = rc(cols - 4);
    const x2 = x1 + 3 + Math.floor(rand() * 5);
    const y = 1 + rc(rows - 1);
    hBeam(CELL * x1, CELL * x2, CELL * y, pick());
  }

  // random vBeams
  const vCount = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < vCount; i++) {
    const x = 1 + rc(cols - 1);
    const y1 = rc(rows - 3);
    const y2 = y1 + 2 + Math.floor(rand() * 3);
    vBeam(CELL * x, CELL * y1, CELL * y2, pick());
  }

  // random lBeams
  const lCount = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < lCount; i++) {
    const cx = 2 + rc(cols - 4);
    const cy = 1 + rc(rows - 3);
    const hLen = 2 + Math.floor(rand() * 3);
    const vLen = 1.5 + rand() * 2;
    const dir = rand() > 0.5 ? "right" : "left";
    lBeam(CELL * cx, CELL * cy, CELL * hLen, CELL * vLen, dir, pick());
  }
}

export default function BlogCoverCard({
  id = "default",
  category,
  title,
}: {
  id?: string;
  category?: string;
  title?: string;
}) {
  const coverRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cover = coverRef.current;
    const canvas = canvasRef.current;
    if (!cover || !canvas) return;

    const draw = () => drawCanvas(canvas, cover, id);
    draw();

    const ro = new ResizeObserver(draw);
    ro.observe(cover);
    return () => ro.disconnect();
  }, [id]);

  return (
    <div
      ref={coverRef}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "#0d0d0d",
        position: "relative",
        overflow: "hidden",
        containerType: "inline-size",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 8cqi",
          gap: "4cqi",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "2.5cqi",
          }}
        >
          {category && (
            <Badge
              variant={"secondary"}
              style={{
                padding: "0.6cqi 2cqi",
                fontSize: "3cqi",
              }}
            >
              {category}
            </Badge>
          )}

          {title && (
            <div
              style={{
                fontSize: "7cqi",
                fontWeight: 600,
                color: "#ffffff",
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
