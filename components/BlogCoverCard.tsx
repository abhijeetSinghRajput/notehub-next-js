import { useEffect, useRef } from "react";

function drawCanvas(canvas: HTMLCanvasElement, cover: HTMLElement): void {
  const W = cover.offsetWidth;
  const H = cover.offsetHeight;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  const CELL = Math.round(W / 14);
  const cols = Math.ceil(W / CELL) + 1;
  const rows = Math.ceil(H / CELL) + 1;

  if(!ctx) return;
  
  ctx.clearRect(0, 0, W, H);

  const filledCells = [
    [1, 1],
    [2, 1],
    [5, 2],
    [6, 2],
    [8, 1],
    [9, 3],
    [10, 2],
    [11, 1],
    [3, 4],
    [7, 3],
    [12, 2],
    [4, 5],
    [8, 4],
    [10, 5],
    [1, 5],
    [13, 3],
  ];

  filledCells.forEach(([c, r]) => {
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
  });

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

  function hBeam(x1: number, x2:number, y:number, color:string) : void {
    if(!ctx) return;
    
    const grad = ctx.createLinearGradient(x1, y, x2, y);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }

  function vBeam(x:number, y1:number, y2:number, color: string) : void{
    if(!ctx) return;

    const grad = ctx.createLinearGradient(x, y1, x, y2);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.3, color);
    grad.addColorStop(0.7, color);
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }

  function lBeam(cornerX: number, cornerY: number, hLen: number, vLen: number, dir: "right" | "left", color: string) : void {
    if(!ctx) return;

    const hx1 = dir === "right" ? cornerX - hLen : cornerX;
    const hx2 = dir === "right" ? cornerX : cornerX + hLen;

    const hGrad = ctx.createLinearGradient(hx1, cornerY, hx2, cornerY);
    hGrad.addColorStop(0, "transparent");
    hGrad.addColorStop(1, color);
    ctx.strokeStyle = hGrad;
    ctx.lineWidth = 1.5;
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
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cornerX, cornerY);
    ctx.lineTo(cornerX, cornerY + vLen);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cornerX, cornerY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  hBeam(CELL * 2, CELL * 7, CELL * 2, "rgba(194, 194, 194,0.6)");
  hBeam(CELL * 5, CELL * 13, CELL * 5, "rgba(255,255,255,0.35)");
  hBeam(CELL * 1, CELL * 5, CELL * 3.5, "rgba(194, 194, 194,0.3)");
  vBeam(CELL * 9, CELL * 1, CELL * 5, "rgba(255,255,255,0.3)");
  vBeam(CELL * 3, CELL * 0, CELL * 3, "rgba(194, 194, 194,0.4)");
  lBeam(
    CELL * 6,
    CELL * 1,
    CELL * 3,
    CELL * 2.5,
    "right",
    "rgba(194, 194, 194,0.7)",
  );
  lBeam(
    CELL * 11,
    CELL * 3,
    CELL * 3,
    CELL * 2,
    "right",
    "rgba(255,255,255,0.5)",
  );
  lBeam(
    CELL * 2,
    CELL * 4,
    CELL * 2,
    CELL * 1.5,
    "left",
    "rgba(194, 194, 194,0.4)",
  );
}

export default function BlogCoverCard({
  category,
  title,
}: {
  category?: string;
  title?: string;
}) {
  const coverRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const cover = coverRef.current;
    const canvas = canvasRef.current;
    if (!cover || !canvas) return;

    const draw = () => drawCanvas(canvas, cover);
    draw();

    const ro = new ResizeObserver(draw);
    ro.observe(cover);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={coverRef}
      style={{
        width: "100%",
        aspectRatio: "16/9",
        background: "#0d0d0f",
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

      {/* Content */}
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
        {/* Left: pill + title */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "2.5cqi",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "0.5px solid rgba(255,255,255,0.25)",
              borderRadius: "999px",
              padding: "0.6cqi 2cqi",
              fontSize: "3cqi",
              color: "rgba(255,255,255,0.7)",
              width: "max-content",
              letterSpacing: "0.02em",
            }}
          >
            {category}
          </span>

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
        </div>
      </div>
    </div>
  );
}
