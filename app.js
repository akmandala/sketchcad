const canvas = document.getElementById("diagramCanvas");
const ctx = canvas.getContext("2d");

const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const snippetBtn = document.getElementById("snippetBtn");
const symbolHelperBtn = document.getElementById("symbolHelperBtn");

const state = {
  components: [],
  stroke: [],
  isDrawing: false,
  nextId: 1,
};

function addMessage(text, kind = "system") {
  const el = document.createElement("div");
  el.className = `message ${kind}`;
  el.textContent = text;
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function point(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) * canvas.width) / rect.width,
    y: ((evt.clientY - rect.top) * canvas.height) / rect.height,
  };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function bounds(points) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

function area(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const j = (i + 1) % points.length;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum) / 2;
}

function length(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += dist(points[i - 1], points[i]);
  }
  return total;
}

function corners(points) {
  let count = 0;
  for (let i = 2; i < points.length; i += 4) {
    const a = points[i - 2];
    const b = points[i - 1];
    const c = points[i];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const bcx = c.x - b.x;
    const bcy = c.y - b.y;
    const mag = Math.hypot(abx, aby) * Math.hypot(bcx, bcy);
    if (!mag) {
      continue;
    }
    const dot = abx * bcx + aby * bcy;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot / mag)));
    if (angle > 0.8 && angle < 2.3) {
      count += 1;
    }
  }
  return count;
}

function inferSymbol(shape, box) {
  if (shape === "circle") {
    return "MCU Controller";
  }
  if (shape === "triangle") {
    return "Amplifier / Driver";
  }
  if (shape === "rectangle" && box.h > box.w * 1.2) {
    return "Battery & Power Mgmt";
  }
  if (shape === "rounded") {
    return "Network Interface";
  }
  return "DCDC Converter";
}

function recognize(points) {
  if (points.length < 12) {
    return null;
  }

  const box = bounds(points);
  if (box.w < 25 || box.h < 25) {
    return null;
  }

  const closed = dist(points[0], points[points.length - 1]) < Math.min(box.w, box.h) * 0.5;
  if (!closed) {
    return null;
  }

  const a = area(points);
  const p = length(points);
  const circularity = (4 * Math.PI * a) / (p * p);
  const cornerCount = corners(points);

  if (circularity > 0.7) {
    return { shape: "circle", box };
  }
  if (cornerCount >= 2 && cornerCount <= 3) {
    return { shape: "triangle", box };
  }
  if (cornerCount >= 4 && circularity < 0.55) {
    return { shape: "rectangle", box };
  }
  return { shape: "rounded", box };
}

function drawComponent(component) {
  ctx.save();
  ctx.strokeStyle = "#1f2b3d";
  ctx.lineWidth = 2;
  ctx.fillStyle = "#ffffff";

  if (component.shape === "circle") {
    const r = Math.min(component.w, component.h) / 2;
    ctx.beginPath();
    ctx.arc(component.x + component.w / 2, component.y + component.h / 2, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (component.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(component.x + component.w / 2, component.y);
    ctx.lineTo(component.x + component.w, component.y + component.h);
    ctx.lineTo(component.x, component.y + component.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    const radius = component.shape === "rounded" ? 14 : 6;
    ctx.beginPath();
    ctx.roundRect(component.x, component.y, component.w, component.h, radius);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#122035";
  ctx.font = "14px Inter, sans-serif";
  ctx.fillText(component.symbol, component.x + 8, component.y + 22);
  ctx.restore();
}

function drawStroke() {
  if (state.stroke.length < 2) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = "#8645f5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.stroke[0].x, state.stroke[0].y);
  for (let i = 1; i < state.stroke.length; i += 1) {
    ctx.lineTo(state.stroke[i].x, state.stroke[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  state.components.forEach(drawComponent);
  drawStroke();
}

canvas.addEventListener("pointerdown", (evt) => {
  state.isDrawing = true;
  state.stroke = [point(evt)];
  canvas.setPointerCapture(evt.pointerId);
});

canvas.addEventListener("pointermove", (evt) => {
  if (!state.isDrawing) {
    return;
  }
  state.stroke.push(point(evt));
  render();
});

canvas.addEventListener("pointerup", () => {
  if (!state.isDrawing) {
    return;
  }

  state.isDrawing = false;
  const parsed = recognize(state.stroke);
  state.stroke = [];

  if (!parsed) {
    addMessage("I could not recognize that shape yet. Try a closed rectangle, circle, triangle, or rounded box.");
    render();
    return;
  }

  const symbol = inferSymbol(parsed.shape, parsed.box);
  const component = {
    id: state.nextId,
    x: parsed.box.minX,
    y: parsed.box.minY,
    w: Math.max(98, parsed.box.w),
    h: Math.max(64, parsed.box.h),
    shape: parsed.shape,
    symbol,
  };
  state.nextId += 1;
  state.components.push(component);
  addMessage(`Recognized ${parsed.shape} and mapped it to ${symbol}.`);
  render();
});

analyzeBtn.addEventListener("click", () => {
  if (!state.components.length) {
    addMessage("No blocks detected yet. Sketch at least one block first.");
    return;
  }

  const counts = state.components.reduce((acc, item) => {
    acc[item.symbol] = (acc[item.symbol] || 0) + 1;
    return acc;
  }, {});

  const summary = Object.entries(counts)
    .map(([name, count]) => `${count}× ${name}`)
    .join(", ");

  addMessage(`Sketch understanding: ${summary}. You can now generate a design snippet.`);
});

snippetBtn.addEventListener("click", () => {
  if (!state.components.length) {
    addMessage("Need at least one recognized block before generating a snippet.");
    return;
  }

  const snippet = {
    project: "SketchCAD Prototype",
    blocks: state.components.map((item) => ({
      id: item.id,
      type: item.symbol,
      shape: item.shape,
      position: { x: Math.round(item.x), y: Math.round(item.y) },
      size: { w: Math.round(item.w), h: Math.round(item.h) },
    })),
    intent: "Convert freehand electronics sketch into structured design data",
  };

  addMessage(`Generated design snippet:\n${JSON.stringify(snippet, null, 2)}`);
});

chatForm.addEventListener("submit", (evt) => {
  evt.preventDefault();
  const text = chatInput.value.trim();
  if (!text) {
    return;
  }
  addMessage(text, "user");
  addMessage("Prototype note: chat is local mock for now. LLM integration endpoint can be connected later.");
  chatInput.value = "";
});

symbolHelperBtn.addEventListener("click", () => {
  addMessage("Symbol helper page placeholder: you can plug your uploader/manager here later.");
});

addMessage("Start by sketching an electronics block on the canvas.");
addMessage("Flow: Sketch block → Analyze sketch → Generate design snippet.");
render();
