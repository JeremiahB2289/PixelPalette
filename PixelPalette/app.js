// Constants & State
const GRID_SIZE = 32;
const DISPLAY_SIZE = 512;
const PIXEL = DISPLAY_SIZE / GRID_SIZE;

let grid = [];
let currentTool = "pencil";

let primaryColor = "#ff00ff";
let secondaryColor = "#00ffff";

let showGrid = true;

// Undo / Redo
let undoStack = [];
let redoStack = [];

// Track which button started the drag
let isDrawing = false;
let activeButton = 0;

// Canvas Setup
const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");

function initGrid() {
  grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
}
initGrid();

// Rendering
function render() {
  ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      ctx.fillStyle = grid[y][x] || "#111";
      ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
    }
  }

  if (showGrid) {
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL, 0);
      ctx.lineTo(i * PIXEL, DISPLAY_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * PIXEL);
      ctx.lineTo(DISPLAY_SIZE, i * PIXEL);
      ctx.stroke();
    }
  }
}
render();

// Undo/Redo System
function pushUndo() {
  undoStack.push(JSON.stringify(grid));
  redoStack = [];
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(JSON.stringify(grid));
  grid = JSON.parse(undoStack.pop());
  render();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(JSON.stringify(grid));
  grid = JSON.parse(redoStack.pop());
  render();
}

document.getElementById("undo").onclick = undo;
document.getElementById("redo").onclick = redo;

window.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "z") undo();
  if (e.ctrlKey && e.key === "y") redo();
});

// Mouse Position Helper
function getMouseGridPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((evt.clientX - rect.left) / PIXEL),
    y: Math.floor((evt.clientY - rect.top) / PIXEL)
  };
}

// Painting Tools
function setPixel(x, y, color) {
  grid[y][x] = color;
  render();
}

function erasePixel(x, y) {
  grid[y][x] = null;
  render();
}

// Fill tool
function fillRegion(x, y, newColor) {
  const target = grid[y][x];
  if (target === newColor) return;

  const q = [{ x, y }];
  const visited = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(false)
  );

  while (q.length) {
    const p = q.pop();
    if (
      p.x < 0 || p.x >= GRID_SIZE ||
      p.y < 0 || p.y >= GRID_SIZE ||
      visited[p.y][p.x]
    ) continue;

    visited[p.y][p.x] = true;

    if (grid[p.y][p.x] !== target) continue;

    grid[p.y][p.x] = newColor;

    q.push({ x: p.x + 1, y: p.y });
    q.push({ x: p.x - 1, y: p.y });
    q.push({ x: p.x, y: p.y + 1 });
    q.push({ x: p.x, y: p.y - 1 });
  }
  render();
}

// Mouse Events
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("mousedown", (e) => {
  e.preventDefault();

  isDrawing = true;
  activeButton = e.button;
  pushUndo();

  const { x, y } = getMouseGridPos(e);
  const color = activeButton === 2 ? secondaryColor : primaryColor;

  if (currentTool === "pencil") setPixel(x, y, color);
  else if (currentTool === "eraser") erasePixel(x, y);
  else if (currentTool === "fill") fillRegion(x, y, color);
  else if (currentTool === "eyedrop") {
    const c = grid[y][x];
    if (c) {
      if (activeButton === 0) {
        primaryColor = c;
        document.getElementById("primary-picker").value = c;
      } else if (activeButton === 2) {
        secondaryColor = c;
        document.getElementById("secondary-picker").value = c;
      }
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  const { x, y } = getMouseGridPos(e);
  const color = activeButton === 2 ? secondaryColor : primaryColor;

  if (currentTool === "pencil") setPixel(x, y, color);
  else if (currentTool === "eraser") erasePixel(x, y);
});

window.addEventListener("mouseup", () => {
  isDrawing = false;
  activeButton = 0;
});

// Tool Buttons
document.getElementById("tool-pencil").onclick = () => {
  currentTool = "pencil";
  selectTool("tool-pencil");
};

document.getElementById("tool-eraser").onclick = () => {
  currentTool = "eraser";
  selectTool("tool-eraser");
};

document.getElementById("tool-fill").onclick = () => {
  currentTool = "fill";
  selectTool("tool-fill");
};

document.getElementById("tool-eye-drop").onclick = () => {
  currentTool = "eyedrop";
  selectTool("tool-eye-drop");
};

function selectTool(toolId) {
  document.querySelectorAll(".tool-button").forEach(btn =>
    btn.classList.remove("selected")
  );
  document.getElementById(toolId).classList.add("selected");
}

// Grid Toggle
document.getElementById("toggle-grid").addEventListener("change", (e) => {
  showGrid = e.target.checked;
  render();
});

// Color Pickers
document.getElementById("primary-picker").value = primaryColor;
document.getElementById("primary-picker").oninput = (e) =>
  (primaryColor = e.target.value);

document.getElementById("secondary-picker").value = secondaryColor;
document.getElementById("secondary-picker").oninput = (e) =>
  (secondaryColor = e.target.value);

// Retro Palettes
const retroPalettes = {
  nes: ["#7C7C7C", "#0000FC", "#0000BC", "#4428BC", "#940084"],
  pico8: [
    "#000000","#1D2B53","#7E2553","#008751","#AB5236","#5F574F",
    "#C2C3C7","#FFF1E8","#FF004D","#FFA300","#FFEC27","#00E436",
    "#29ADFF","#83769C","#FF77A8","#FFCCAA"
  ],
  gameboy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"]
};

document.getElementById("palette-select").onchange = (e) => {
  const pal = retroPalettes[e.target.value];
  const paletteEl = document.getElementById("palette");
  paletteEl.innerHTML = "";

  if (!pal) return;

  pal.forEach((color) => {
    const sw = document.createElement("div");
    sw.className = "color-swatch";
    sw.style.background = color;

    sw.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (e.button === 0) {
        primaryColor = color;
        document.getElementById("primary-picker").value = color;
      } else if (e.button === 2) {
        secondaryColor = color;
        document.getElementById("secondary-picker").value = color;
      }
    });

    sw.addEventListener("contextmenu", (e) => e.preventDefault());
    paletteEl.appendChild(sw);
  });
};

// Save / Load Project
document.getElementById("save-json").onclick = () => {
  const data = JSON.stringify(grid);
  const blob = new Blob([data], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pixel-project.json";
  a.click();
};

document.getElementById("load-btn").onclick = () =>
  document.getElementById("load-json").click();

document.getElementById("load-json").onchange = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    grid = JSON.parse(reader.result);
    render();
  };
  reader.readAsText(file);
};

// Export PNG
document.getElementById("export").onclick = () => {
  const small = document.createElement("canvas");
  small.width = GRID_SIZE;
  small.height = GRID_SIZE;
  const sctx = small.getContext("2d");

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      sctx.fillStyle = grid[y][x] || "rgba(0,0,0,0)";
      sctx.fillRect(x, y, 1, 1);
    }
  }

  const a = document.createElement("a");
  a.href = small.toDataURL("image/png");
  a.download = "sprite.png";
  a.click();
};


// Color utility functions
function hexToRgb(hex) {
    if (!hex || hex === "rgba(0,0,0,0)") return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }).join("");
}

function darkenColor(rgb, amount) {
    if (!rgb) return null;
    return {
        r: Math.max(0, rgb.r - amount),
        g: Math.max(0, rgb.g - amount),
        b: Math.max(0, rgb.b - amount)
    };
}

function lightenColor(rgb, amount) {
    if (!rgb) return null;
    return {
        r: Math.min(255, rgb.r + amount),
        g: Math.min(255, rgb.g + amount),
        b: Math.min(255, rgb.b + amount)
    };
}

function getPixelColor(x, y, grid) {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    return grid[y][x];
}

// Calculate edge strength between two pixels
function getEdgeStrength(color1, color2) {
    if (!color1 || !color2) return 0;
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 0;
    
    const dr = rgb1.r - rgb2.r;
    const dg = rgb1.g - rgb2.g;
    const db = rgb1.b - rgb2.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Upscale with auto shading
function upscaleWithShading(scale = 4, enableShading = true) {
    try {
        const upscaleCanvas = document.getElementById("upscaleCanvas");
        const upscaledSize = GRID_SIZE * scale;
        
        // Check for reasonable canvas size limits (most browsers support up to 16k pixels)
        if (upscaledSize > 16384) {
            alert(`Scale factor too large! Maximum canvas size is 16384 pixels. Your ${scale}x scale would create ${upscaledSize}x${upscaledSize} pixels.`);
            return;
        }
        
        // Set canvas size
        upscaleCanvas.width = upscaledSize;
        upscaleCanvas.height = upscaledSize;
        
        // Scale down display size if canvas is too large for comfortable viewing
        const maxDisplaySize = 1024; // Max display size in pixels
        if (upscaledSize > maxDisplaySize) {
            upscaleCanvas.style.width = `${maxDisplaySize}px`;
            upscaleCanvas.style.height = `${maxDisplaySize}px`;
        } else {
            upscaleCanvas.style.width = `${upscaledSize}px`;
            upscaleCanvas.style.height = `${upscaledSize}px`;
        }
        
        const ctx2 = upscaleCanvas.getContext("2d");
        
        // Create image data for direct pixel manipulation
        const imageData = ctx2.createImageData(upscaledSize, upscaledSize);
        const data = imageData.data;
        
        // First pass: upscale with nearest neighbor
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const color = grid[y][x];
                const rgb = hexToRgb(color);
                
                if (!rgb) continue;
                
                // Fill the upscaled block
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const px = x * scale + sx;
                        const py = y * scale + sy;
                        const idx = (py * upscaledSize + px) * 4;
                        
                        data[idx] = rgb.r;
                        data[idx + 1] = rgb.g;
                        data[idx + 2] = rgb.b;
                        data[idx + 3] = 255;
                    }
                }
            }
        }
        
        // Second pass: apply auto shading (color blending between adjacent pixels)
        if (enableShading) {
            for (let y = 0; y < upscaledSize; y++) {
                for (let x = 0; x < upscaledSize; x++) {
                    const idx = (y * upscaledSize + x) * 4;
                    let r = data[idx];
                    let g = data[idx + 1];
                    let b = data[idx + 2];
                    
                    // Get original grid position
                    const origX = Math.floor(x / scale);
                    const origY = Math.floor(y / scale);
                    const subX = x % scale;
                    const subY = y % scale;
                    
                    const currentColor = getPixelColor(origX, origY, grid);
                    if (!currentColor) continue;
                    
                    const currentRgb = hexToRgb(currentColor);
                    if (!currentRgb) continue;
                    
                    // Check adjacent pixels (left, right, top, bottom)
                    const leftColor = getPixelColor(origX - 1, origY, grid);
                    const rightColor = getPixelColor(origX + 1, origY, grid);
                    const topColor = getPixelColor(origX, origY - 1, grid);
                    const bottomColor = getPixelColor(origX, origY + 1, grid);
                    
                    let blendedR = currentRgb.r;
                    let blendedG = currentRgb.g;
                    let blendedB = currentRgb.b;
                    
                    // Blend with left neighbor if different color
                    if (leftColor && leftColor !== currentColor) {
                        const leftRgb = hexToRgb(leftColor);
                        if (leftRgb) {
                            // Calculate weight based on horizontal position (closer to left = more left color)
                            const weight = (scale - subX) / scale;
                            const blendWeight = weight * 0.5; // Reduce influence
                            blendedR = blendedR * (1 - blendWeight) + leftRgb.r * blendWeight;
                            blendedG = blendedG * (1 - blendWeight) + leftRgb.g * blendWeight;
                            blendedB = blendedB * (1 - blendWeight) + leftRgb.b * blendWeight;
                        }
                    }
                    
                    // Blend with right neighbor if different color
                    if (rightColor && rightColor !== currentColor) {
                        const rightRgb = hexToRgb(rightColor);
                        if (rightRgb) {
                            // Calculate weight based on horizontal position (closer to right = more right color)
                            const weight = (subX + 1) / scale;
                            const blendWeight = weight * 0.5; // Reduce influence
                            blendedR = blendedR * (1 - blendWeight) + rightRgb.r * blendWeight;
                            blendedG = blendedG * (1 - blendWeight) + rightRgb.g * blendWeight;
                            blendedB = blendedB * (1 - blendWeight) + rightRgb.b * blendWeight;
                        }
                    }
                    
                    // Blend with top neighbor if different color
                    if (topColor && topColor !== currentColor) {
                        const topRgb = hexToRgb(topColor);
                        if (topRgb) {
                            // Calculate weight based on vertical position (closer to top = more top color)
                            const weight = (scale - subY) / scale;
                            const blendWeight = weight * 0.5; // Reduce influence
                            blendedR = blendedR * (1 - blendWeight) + topRgb.r * blendWeight;
                            blendedG = blendedG * (1 - blendWeight) + topRgb.g * blendWeight;
                            blendedB = blendedB * (1 - blendWeight) + topRgb.b * blendWeight;
                        }
                    }
                    
                    // Blend with bottom neighbor if different color
                    if (bottomColor && bottomColor !== currentColor) {
                        const bottomRgb = hexToRgb(bottomColor);
                        if (bottomRgb) {
                            // Calculate weight based on vertical position (closer to bottom = more bottom color)
                            const weight = (subY + 1) / scale;
                            const blendWeight = weight * 0.5; // Reduce influence
                            blendedR = blendedR * (1 - blendWeight) + bottomRgb.r * blendWeight;
                            blendedG = blendedG * (1 - blendWeight) + bottomRgb.g * blendWeight;
                            blendedB = blendedB * (1 - blendWeight) + bottomRgb.b * blendWeight;
                        }
                    }
                    
                    data[idx] = Math.round(blendedR);
                    data[idx + 1] = Math.round(blendedG);
                    data[idx + 2] = Math.round(blendedB);
                }
            }
        }
        
        
        ctx2.putImageData(imageData, 0, 0);
        
        // Update label with actual size
        const label = upscaleCanvas.parentElement.querySelector('.zoom-label');
        if (label) {
            label.textContent = `Upscaled ${upscaledSize}×${upscaledSize}`;
        }
    
    } catch (error) {
        console.error("Upscaling error:", error);
        alert(`Error during upscaling: ${error.message}. Try a smaller scale factor.`);
    }
}

// Main upscale function
function upscaleImage() {
    const scale = parseInt(document.getElementById("upscale-factor")?.value || "4");
    const enableShading = document.getElementById("enable-shading")?.checked !== false;
    
    upscaleWithShading(scale, enableShading);
}

document.getElementById("ai-upscale").onclick = upscaleImage;
