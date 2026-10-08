import { useEffect, useRef } from "react";
import { useInView } from "../systems/useInView.js";

function build(width, height) {
  const rand = mulberry32(2040);
  const nodes = Array.from({ length: 36 }, () => ({
    x: rand() * width,
    y: rand() * height,
    body: false,
  }));
  const edges = [];
  const near = Math.min(width, height);
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.hypot(dx, dy);
      const limit = nodes[i].body && nodes[j].body ? near * 0.16 : near * 0.09;
      if (dist > 24 && dist < limit) edges.push({ i, j });
    }
  }
  return { nodes, edges };
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function NetworkField() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const inView = useInView(wrapRef, "80px");

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let graph = null;
    const pointer = { x: 0.62, y: 0.5, on: false };
    const onMove = (event) => {
      const rect = wrap.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.on = true;
    };
    const onLeave = () => {
      pointer.on = false;
    };

    const draw = (time) => {
      const ctx = canvas.getContext("2d");
      const rect = wrap.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (!graph) return;
      const form = reduced ? 1 : Math.min(1, time / 7000);
      const shiftX = pointer.on ? (pointer.x - 0.62) * 28 : 0;
      const shiftY = pointer.on ? (pointer.y - 0.5) * 20 : 0;
      const place = (node) => ({
        x: node.x + (node.body ? shiftX * 0.35 : shiftX),
        y: node.y + (node.body ? shiftY * 0.35 : shiftY),
      });

      ctx.lineWidth = 1;
      graph.edges.forEach((edge, index) => {
        const from = graph.nodes[edge.i];
        const to = graph.nodes[edge.j];
        const a = place(from);
        const b = place(to);
        const bodyLink = from.body && to.body;
        const alpha = bodyLink ? 0.12 + form * 0.38 : 0.07;
        ctx.strokeStyle = bodyLink
          ? `rgba(181, 82, 72, ${alpha})`
          : `rgba(126, 184, 180, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        if (!reduced && (bodyLink || index % 3 === 0)) {
          const shift = ((time / (bodyLink ? 2600 : 4200)) + index * 0.07) % 1;
          const px = a.x + (b.x - a.x) * shift;
          const py = a.y + (b.y - a.y) * shift;
          ctx.fillStyle = bodyLink
            ? `rgba(196, 92, 74, ${0.25 + form * 0.55})`
            : "rgba(126, 184, 180, 0.35)";
          ctx.beginPath();
          ctx.arc(px, py, bodyLink ? 1.7 : 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      graph.nodes.forEach((node) => {
        const at = place(node);
        ctx.fillStyle = "rgba(239, 232, 220, 0.28)";
        ctx.beginPath();
        ctx.arc(at.x, at.y, 1.25, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const loop = (time) => {
      draw(time);
      if (!reduced && inView) raf = requestAnimationFrame(loop);
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, rect.width) * dpr;
      canvas.height = Math.max(1, rect.height) * dpr;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      graph = build(rect.width, rect.height);
      draw(reduced ? 8000 : performance.now());
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    if (!reduced && inView) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [inView]);

  return (
    <div className="network" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
