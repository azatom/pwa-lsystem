import { strings } from "./strings.js";

export function addSvgZoom(svg, parentSelector = '') {
  svg.tabIndex = 0;
  const zoomConstant = 6;
  let isPanning = false;
  let isZoomGesture = false;
  let panStartX, panStartY;
  let panStartViewBox = null;
  let zoomGestureStartX, zoomGestureStartY;
  let zoomGestureBaseViewBox = null;
  let lastTapTime = 0;
  let lastTapX = 0, lastTapY = 0;
  (id => document.getElementById(id) ||
    ((sh = document.head.appendChild(Object.assign(document.createElement("style"), { id })).sheet) => (
      sh.insertRule(`${parentSelector} svg { cursor: grab; user-select: none; touch-action: none; }`),
      sh.insertRule(`${parentSelector} svg.panning { cursor: grabbing; }`)
    )())
  )('fixedRandomId9ghLisp4TWg');
  const getXY = e => {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  };
  const vb = () => svg.getAttribute("viewBox").split(/\s+/).map(parseFloat);
  const rect = () => svg.getBoundingClientRect();
  const startPan = e => {
    if (e.button && e.button !== 0) return;
    const p = getXY(e);
    panStartX = p.x; panStartY = p.y;
    panStartViewBox = vb();
    isPanning = true;
    isZoomGesture = false;
    svg.classList.add('panning');
  };
  const move = e => {
    if (!isPanning && !isZoomGesture) return;
    e.preventDefault();
    const p = getXY(e);
    const r = rect();
    if (isPanning) {
      const v = panStartViewBox;
      const scale = Math.min(r.width / v[2], r.height / v[3]);
      const dx = (p.x - panStartX) / scale;
      const dy = (p.y - panStartY) / scale;
      svg.setAttribute("viewBox", `${v[0] - dx} ${v[1] - dy} ${v[2]} ${v[3]}`);
      return;
    }
    if (isZoomGesture) {
      const deltaYrem = (p.y - zoomGestureStartY) / parseFloat(getComputedStyle(document.documentElement).fontSize);
      const base = zoomGestureBaseViewBox;
      const cx = base[0] + base[2] * (zoomGestureStartX - r.left) / r.width;
      const cy = base[1] + base[3] * (zoomGestureStartY - r.top) / r.height;
      let factor;
      if (deltaYrem >= 0) {
        factor = 1 + deltaYrem / zoomConstant;
      } else {
        factor = Math.pow(2, deltaYrem / zoomConstant);
      }
      factor = Math.max(0.02, Math.min(100, factor));
      const newW = base[2] / factor;
      const newH = base[3] / factor;
      const newX = cx - (cx - base[0]) / factor;
      const newY = cy - (cy - base[1]) / factor;
      svg.setAttribute("viewBox", `${newX} ${newY} ${newW} ${newH}`);
    }
  };
  const end = () => {
    isPanning = false;
    isZoomGesture = false;
    svg.classList.remove('panning');
  };
  const zoomAtPoint = (cx, cy, factor) => {
    const v = vb();
    const newW = v[2] / factor;
    const newH = v[3] / factor;
    const newX = cx - (cx - v[0]) / factor;
    const newY = cy - (cy - v[1]) / factor;
    svg.setAttribute("viewBox", `${newX} ${newY} ${newW} ${newH}`);
  };
  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const r = rect();
    const v = vb();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const cx = v[0] + v[2] * mx / r.width;
    const cy = v[1] + v[3] * my / r.height;
    const factor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
    zoomAtPoint(cx, cy, factor);
  }, { passive: false });
  const handlePotentialDoubleTap = e => {
    if (e.touches && e.touches.length > 1) return;
    const now = Date.now();
    const p = getXY(e);
    if (now - lastTapTime < 450 && Math.hypot(p.x - lastTapX, p.y - lastTapY) < 40) {
      e.preventDefault();
      zoomGestureStartX = p.x;
      zoomGestureStartY = p.y;
      zoomGestureBaseViewBox = vb();
      isZoomGesture = true;
      return;
    }
    lastTapTime = now;
    lastTapX = p.x;
    lastTapY = p.y;
  };
  svg.addEventListener("dblclick", e => {
    e.preventDefault();
    const r = rect();
    const v = vb();
    const cx = v[0] + v[2] * (e.clientX - r.left) / r.width;
    const cy = v[1] + v[3] * (e.clientY - r.top) / r.height;
    zoomAtPoint(cx, cy, 2);
  });
  svg.addEventListener("keydown", e => {
    if (e.key === "+" || e.key === "=" || e.key === "-") {
      e.preventDefault();
      const v = vb();
      const factor = e.key === "-" ? 1 / 1.3 : 1.3;
      zoomAtPoint(v[0] + v[2] / 2, v[1] + v[3] / 2, factor);
    }
  });
  svg.addEventListener("mousedown", startPan);
  svg.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    handlePotentialDoubleTap(e);
    if (!isZoomGesture) startPan(e);
  }, { passive: false });
  svg.addEventListener("mousemove", move);
  svg.addEventListener("touchmove", move, { passive: false });
  svg.addEventListener("mouseup", end);
  svg.addEventListener("mouseleave", end);
  svg.addEventListener("touchend", end);
  svg.addEventListener("touchcancel", end);
  svg.addEventListener("mousemove", e => {
    const r = rect();
    const v = vb();
    const x = v[0] + v[2] * (e.clientX - r.left) / r.width;
    const y = v[1] + v[3] * (e.clientY - r.top) / r.height;
  });
  return svg;
}

export async function downloadSvg(svg, isMinimized) {
  const serializer = new XMLSerializer();
  const xmlStr = serializer.serializeToString(svg);
  const uint8Array = new TextEncoder().encode(xmlStr);
  const blob = new Blob([uint8Array], { type: "image/svg+xml" });
  const filename = `${svg.querySelector("title")?.textContent ?? strings.untitled}.svg`;
  await downloadBlob(blob, filename);
}

export async function downloadPng(svg, m) {
  let [x, y, w, h] = svg.getAttribute("viewBox").split(" ").map(parseFloat);
  if (!svg || m === null) return;
  m = Number(m) || 3840;
  [w, h] = w < h ? [Math.ceil(m * w / h), m] : [m, Math.ceil(m * h / w)];
  const img = new Image()
    , canvas = document.createElement("canvas")
    , ctx = canvas.getContext("2d");
  img.src = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svg));
  await new Promise((resolve) => img.onload = resolve);
  ctx.drawImage(img, 0, 0, canvas.width = w, canvas.height = h);
  ctx.getImageData(0, 0, 1, 1);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(blob => blob
    ? resolve(blob)
    : reject(new Error(strings.error)), "image/png"
  ));
  const filename = `${svg.querySelector("title")?.textContent ?? strings.untitled}.png`;
  await downloadBlob(blob, filename);
  return { w, h, s: blob.size, filename };
}

async function downloadBlob(blob, filename) {
  let url;
  try {
    url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    message(e.message);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}
