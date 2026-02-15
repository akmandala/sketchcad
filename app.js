const canvas = document.getElementById("diagramCanvas");
const ctx = canvas.getContext("2d");
const drawModeBtn = document.getElementById("drawModeBtn");
const connectModeBtn = document.getElementById("connectModeBtn");
const statusEl = document.getElementById("status");
const clearBtn = document.getElementById("clearBtn");
const wireTypeEl = document.getElementById("wireType");

const componentForm = document.getElementById("componentForm");
const symbolTypeEl = document.getElementById("symbolType");
const labelInput = document.getElementById("labelInput");
const vinInput = document.getElementById("vinInput");
const voutInput = document.getElementById("voutInput");
const imaxInput = document.getElementById("imaxInput");

const state = {
  mode: "draw",
  components: [],
  connections: [],
  currentStroke: [],
  isDrawing: false,
  nextId: 0,
  selectedComponentId: null,
  connectSelection: [],
};

const shapeDefaults = {
  rectangle: "DCDC Converter",
  circle: "MCU Controller",
  triangle: "Motor Driver",
};

function setStatus(text) {
  statusEl.textContent = text;
}

function pointerPosition(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) * canvas.width) / rect.width,
    y: ((evt.clientY - rect.top) * canvas.height) / rect.height,
    p: evt.pressure || 0.5,
  };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function strokeLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += dist(points[i - 1], points[i]);
  }
  return total;
}

function boundingBox(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

function polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

function cornerCount(points) {
  let corners = 0;
  for (let i = 2; i < points.length; i += 3) {
    const a = points[i - 2];
    const b = points[i - 1];
    const c = points[i];
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const bc = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * bc.x + ab.y * bc.y;
    const mag = Math.hypot(ab.x, ab.y) * Math.hypot(bc.x, bc.y);
    if (!mag) continue;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot / mag)));
    if (angle > 0.75 && angle < 2.35) corners += 1;
  }
  return corners;
}

function recognizeShape(points) {
  if (points.length < 12) return null;
  const box = boundingBox(points);
  if (box.w < 24 || box.h < 24) return null;

  const closed = dist(points[0], points[points.length - 1]) < Math.min(box.w, box.h) * 0.45;
  if (!closed) return null;

  const area = polygonArea(points);
  const perimeter = strokeLength(points);
  const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
  const corners = cornerCount(points);

  if (circularity > 0.68) return { kind: "circle", box };
  if (corners >= 4) return { kind: "rectangle", box };
  if (corners >= 2) return { kind: "triangle", box };
  return { kind: "rectangle", box };
}

function drawComponent(comp) {
  ctx.save();
  ctx.lineWidth = state.selectedComponentId === comp.id ? 3 : 2;
  ctx.strokeStyle = state.selectedComponentId === comp.id ? "#2143b9" : "#2a3242";
  ctx.fillStyle = "#ffffff";

  if (comp.shape === "circle") {
    const r = Math.min(comp.w, comp.h) / 2;
    ctx.beginPath();
    ctx.arc(comp.x + comp.w / 2, comp.y + comp.h / 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (comp.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(comp.x + comp.w / 2, comp.y);
    ctx.lineTo(comp.x + comp.w, comp.y + comp.h);
    ctx.lineTo(comp.x, comp.y + comp.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    const radius = comp.symbol === "Network Interface" ? 14 : 4;
    ctx.beginPath();
    ctx.roundRect(comp.x, comp.y, comp.w, comp.h, radius);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#0d1322";
  ctx.font = "14px Inter, sans-serif";
  const title = comp.label || comp.symbol;
  ctx.fillText(title, comp.x + 8, comp.y + 20);

  ctx.font = "12px Inter, sans-serif";
  if (comp.vin || comp.vout || comp.imax) {
    const details = [comp.vin && `Vin:${comp.vin}`, comp.vout && `Vout:${comp.vout}`, comp.imax && `I:${comp.imax}`]
      .filter(Boolean)
      .join("  ");
    ctx.fillText(details, comp.x + 8, comp.y + 38);
  }
  ctx.restore();
}

function connectionPoint(comp) {
  return { x: comp.x + comp.w / 2, y: comp.y + comp.h / 2 };
}

function drawConnection(conn) {
  const from = state.components.find((c) => c.id === conn.from);
  const to = state.components.find((c) => c.id === conn.to);
  if (!from || !to) return;
  const a = connectionPoint(from);
  const b = connectionPoint(to);

  ctx.save();
  ctx.strokeStyle = "#0e8d5f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();

  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  ctx.fillStyle = "#0e8d5f";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(conn.type, mx + 4, my - 4);
  ctx.restore();
}

function drawStroke() {
  if (state.currentStroke.length < 2) return;
  ctx.save();
  ctx.strokeStyle = "#7d3ef2";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.currentStroke[0].x, state.currentStroke[0].y);
  for (let i = 1; i < state.currentStroke.length; i += 1) {
    ctx.lineTo(state.currentStroke[i].x, state.currentStroke[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.connections.forEach(drawConnection);
  state.components.forEach(drawComponent);
  drawStroke();
}

function selectComponent(id) {
  state.selectedComponentId = id;
  const comp = state.components.find((item) => item.id === id);
  if (!comp) return;
  symbolTypeEl.value = comp.symbol;
  labelInput.value = comp.label;
  vinInput.value = comp.vin;
  voutInput.value = comp.vout;
  imaxInput.value = comp.imax;
}

function findComponentAt(pt) {
  return [...state.components].reverse().find((comp) => {
    if (comp.shape === "circle") {
      const c = connectionPoint(comp);
      return dist(pt, c) <= Math.min(comp.w, comp.h) / 2;
    }

    if (comp.shape === "triangle") {
      const withinX = pt.x >= comp.x && pt.x <= comp.x + comp.w;
      const withinY = pt.y >= comp.y && pt.y <= comp.y + comp.h;
      return withinX && withinY;
    }

    return pt.x >= comp.x && pt.x <= comp.x + comp.w && pt.y >= comp.y && pt.y <= comp.y + comp.h;
  });
}

function createComponent(recognized) {
  const { box, kind } = recognized;
  const comp = {
    id: state.nextId += 1,
    shape: kind,
    x: box.minX,
    y: box.minY,
    w: Math.max(90, box.w),
    h: Math.max(56, box.h),
    symbol: shapeDefaults[kind],
    label: "",
    vin: "",
    vout: "",
    imax: "",
  };

  if (comp.symbol === "DCDC Converter") {
    comp.label = "DCDC";
    comp.vin = "9-36V";
    comp.vout = "5V";
    comp.imax = "2A";
  }

  state.components.push(comp);
  selectComponent(comp.id);
  setStatus(`Recognized ${kind}. Component created: ${comp.symbol}.`);
}

canvas.addEventListener("pointerdown", (evt) => {
  const pt = pointerPosition(evt);
  if (state.mode === "connect") {
    const hit = findComponentAt(pt);
    if (!hit) return;
    state.connectSelection.push(hit.id);
    selectComponent(hit.id);
    if (state.connectSelection.length === 2) {
      const [from, to] = state.connectSelection;
      if (from !== to) {
        state.connections.push({ from, to, type: wireTypeEl.value });
        setStatus(`Connected #${from} to #${to} with ${wireTypeEl.value}.`);
      }
      state.connectSelection = [];
      redraw();
    } else {
      setStatus(`Selected component #${hit.id}. Pick a second component to connect.`);
      redraw();
    }
    return;
  }

  state.isDrawing = true;
  state.currentStroke = [pt];
  canvas.setPointerCapture(evt.pointerId);
});

canvas.addEventListener("pointermove", (evt) => {
  if (!state.isDrawing) return;
  state.currentStroke.push(pointerPosition(evt));
  redraw();
});

canvas.addEventListener("pointerup", () => {
  if (!state.isDrawing) return;
  state.isDrawing = false;
  const recognized = recognizeShape(state.currentStroke);
  state.currentStroke = [];
  if (recognized) {
    createComponent(recognized);
  } else {
    setStatus("Could not recognize shape. Try a clearer closed box, circle, or triangle.");
  }
  redraw();
});

canvas.addEventListener("click", (evt) => {
  if (state.mode !== "draw") return;
  const hit = findComponentAt(pointerPosition(evt));
  if (hit) {
    selectComponent(hit.id);
    redraw();
  }
});

drawModeBtn.addEventListener("click", () => {
  state.mode = "draw";
  drawModeBtn.classList.add("active");
  connectModeBtn.classList.remove("active");
  state.connectSelection = [];
  setStatus("Draw mode active. Sketch a closed shape to add a component.");
});

connectModeBtn.addEventListener("click", () => {
  state.mode = "connect";
  connectModeBtn.classList.add("active");
  drawModeBtn.classList.remove("active");
  state.connectSelection = [];
  setStatus("Connect mode active. Tap two components to create a wire.");
});

componentForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  const comp = state.components.find((item) => item.id === state.selectedComponentId);
  if (!comp) {
    setStatus("Select a component first.");
    return;
  }

  comp.symbol = symbolTypeEl.value;
  comp.label = labelInput.value.trim();
  comp.vin = vinInput.value.trim();
  comp.vout = voutInput.value.trim();
  comp.imax = imaxInput.value.trim();
  setStatus(`Updated component #${comp.id}.`);
  redraw();
});

clearBtn.addEventListener("click", () => {
  state.components = [];
  state.connections = [];
  state.selectedComponentId = null;
  state.connectSelection = [];
  setStatus("Diagram cleared.");
  redraw();
});

redraw();
