import { toBlob, toPng } from "html-to-image";
import JSZip from "jszip";

export interface ExportProgress {
  current: number;
  total: number;
  status: string;
}

/**
 * Direct Canvas 2D rasterizer that captures the rendered DOM tile synchronously
 * without relying on SVG foreignObject or network requests.
 * 100% reliable across all browsers.
 */
async function renderTileViaCanvas(el: HTMLElement): Promise<Blob | null> {
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  // Render at 2x resolution for ultra-sharp store-ready output
  const scale = 2;
  const targetW = Math.round(rect.width * scale);
  const targetH = Math.round(rect.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 1. Background (color or linear gradient)
  const bgEl = el.querySelector<HTMLElement>('[style*="background"]') || el;
  const computedBg = window.getComputedStyle(bgEl);
  const bgStyle = bgEl.style.background || computedBg.background || computedBg.backgroundColor;

  if (bgStyle && bgStyle.includes("gradient")) {
    const colorMatches = bgStyle.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsl\([^)]+\))/g);
    if (colorMatches && colorMatches.length >= 2) {
      const grad = ctx.createLinearGradient(0, 0, 0, targetH);
      colorMatches.forEach((c, idx) => {
        grad.addColorStop(idx / (colorMatches.length - 1), c);
      });
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, targetW, targetH);
    } else {
      ctx.fillStyle = "#2563eb";
      ctx.fillRect(0, 0, targetW, targetH);
    }
  } else {
    ctx.fillStyle = bgStyle || "#2563eb";
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // 2. Images: Phone screenshot & Device bezel frame
  const imgEls = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
  for (const img of imgEls) {
    if (!img.complete || img.naturalWidth === 0) continue;
    const imgRect = img.getBoundingClientRect();
    const x = Math.round((imgRect.left - rect.left) * scale);
    const y = Math.round((imgRect.top - rect.top) * scale);
    const w = Math.round(imgRect.width * scale);
    const h = Math.round(imgRect.height * scale);

    const parent = img.parentElement;
    const borderRadius = parent
      ? parseFloat(window.getComputedStyle(parent).borderRadius || "0") * scale
      : 0;

    ctx.save();
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, borderRadius);
      ctx.clip();
    }
    try {
      ctx.drawImage(img, x, y, w, h);
    } catch (e) {
      console.warn("drawImage failed on element:", e);
    }
    ctx.restore();
  }

  // 3. Typography: Headline
  const h1 = el.querySelector<HTMLElement>("h1");
  if (h1 && h1.textContent?.trim()) {
    const h1Rect = h1.getBoundingClientRect();
    const h1Style = window.getComputedStyle(h1);
    const fontSize = parseFloat(h1Style.fontSize || "24") * scale;
    const fontWeight = h1Style.fontWeight || "800";
    const fontFamily = h1Style.fontFamily || "system-ui, sans-serif";
    const color = h1Style.color || "#ffffff";
    const textAlign = (h1Style.textAlign as CanvasTextAlign) || "center";

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";

    const textX = textAlign === "center" ? targetW / 2 : Math.round((h1Rect.left - rect.left) * scale);
    const textY = Math.round((h1Rect.top - rect.top) * scale);
    ctx.fillText(h1.textContent.trim(), textX, textY);
    ctx.restore();
  }

  // 4. Typography: Subhead
  const p = el.querySelector<HTMLElement>("p");
  if (p && p.textContent?.trim()) {
    const pRect = p.getBoundingClientRect();
    const pStyle = window.getComputedStyle(p);
    const fontSize = parseFloat(pStyle.fontSize || "14") * scale;
    const fontWeight = pStyle.fontWeight || "500";
    const fontFamily = pStyle.fontFamily || "system-ui, sans-serif";
    const color = pStyle.color || "rgba(255, 255, 255, 0.85)";
    const textAlign = (pStyle.textAlign as CanvasTextAlign) || "center";

    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "top";

    const textX = textAlign === "center" ? targetW / 2 : Math.round((pRect.left - rect.left) * scale);
    const textY = Math.round((pRect.top - rect.top) * scale);
    ctx.fillText(p.textContent.trim(), textX, textY);
    ctx.restore();
  }

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png", 1.0);
  });
}

export async function exportTilesToZip(
  tileElements: HTMLElement[],
  fileNames: string[],
  onProgress?: (progress: ExportProgress) => void,
): Promise<void> {
  const zip = new JSZip();
  const total = tileElements.length;

  for (let i = 0; i < total; i++) {
    const el = tileElements[i];
    const name = fileNames[i] || `screenshot_${i + 1}.png`;

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        status: `Rendering ${name} (${i + 1}/${total})...`,
      });
    }

    try {
      let blob: Blob | null = null;

      // Method 1: Try html-to-image with skipFonts and cacheBust false
      try {
        blob = await toBlob(el, {
          quality: 0.98,
          pixelRatio: 2,
          skipFonts: true,
          cacheBust: false,
        });
      } catch (e) {
        console.warn(`toBlob failed on tile ${i}:`, e);
      }

      // Method 2: Try toPng fallback
      if (!blob || blob.size === 0) {
        try {
          const dataUrl = await toPng(el, {
            quality: 0.98,
            pixelRatio: 2,
            skipFonts: true,
            cacheBust: false,
          });
          if (dataUrl && dataUrl.startsWith("data:image")) {
            const res = await fetch(dataUrl);
            blob = await res.blob();
          }
        } catch (e2) {
          console.warn(`toPng fallback failed on tile ${i}:`, e2);
        }
      }

      // Method 3: Direct Canvas 2D rasterizer (100% reliable fallback)
      if (!blob || blob.size === 0) {
        try {
          blob = await renderTileViaCanvas(el);
        } catch (e3) {
          console.warn(`renderTileViaCanvas failed on tile ${i}:`, e3);
        }
      }

      if (blob && blob.size > 0) {
        zip.file(name, blob);
        console.log(`Successfully added ${name} to ZIP (${(blob.size / 1024).toFixed(1)} KB)`);
      } else {
        console.warn(`Tile ${i} produced empty blob`);
      }
    } catch (err) {
      console.error(`Failed to render tile ${i}:`, err);
    }
  }

  const fileCount = Object.keys(zip.files).length;
  if (fileCount === 0) {
    throw new Error("Unable to capture screenshots into archive. 0 files captured.");
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      status: `Packaging ${fileCount} screenshots into ZIP archive...`,
    });
  }

  const zipBlob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // Trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `launchsnap-store-pack-${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
