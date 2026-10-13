import { DownloadIcon, Loader2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CUSTOM_TEMPLATE } from "../App";
import { exportTilesToZip } from "../lib/clientExport";

/**
 * Handles exporting screenshots to ZIP:
 * 1. Primary: Fast in-browser high-res HTML/Canvas export using exportTilesToZip (works standalone on web)
 * 2. Secondary: CLI backend export via /api/export if running locally
 */
export function ExportPanel({
  background,
  frames,
  font,
  template,
  layout,
  screenOnly,
}: {
  background: string;
  /** Bezel variant per device key; empty values mean the config's custom art. */
  frames: Record<string, string>;
  /** A --font key, or undefined to keep the config's font. */
  font: string | undefined;
  /** A built-in template key, "" for none, or the custom sentinel (left to the sidecar/config). */
  template: string;
  layout: string;
  screenOnly: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [log]);

  async function exportBrowserZip() {
    if (busy) return;
    const tiles = Array.from(document.querySelectorAll<HTMLElement>(".tile-shadow"));
    if (tiles.length === 0) {
      setLog("No screenshots rendered on stage to export.");
      return;
    }

    setBusy(true);
    setLog("Starting high-resolution browser export...");

    try {
      const fileNames = tiles.map((el, i) => {
        const sceneId = el.closest("[data-scene-id]")?.getAttribute("data-scene-id");
        return sceneId ? `0${i + 1}_${sceneId}.png` : `0${i + 1}_screenshot.png`;
      });

      await exportTilesToZip(tiles, fileNames, (progress) => {
        setLog(progress.status);
      });

      setLog(null);
    } catch (err) {
      setLog(`Browser export error: ${err instanceof Error ? err.message : err}. Trying server CLI...`);
      await exportServerZip();
    } finally {
      setBusy(false);
    }
  }

  async function exportServerZip() {
    setBusy(true);
    let text = "";
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          background,
          frames,
          font,
          template: template === CUSTOM_TEMPLATE ? undefined : template || "none",
          layout,
          screenOnly,
        }),
      });
      if (!res.ok || !res.body) {
        setLog(`${res.status}: ${await res.text()}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setLog(text);
      }
      if (text.includes("[done]")) {
        setLog(null);
        const a = document.createElement("a");
        a.href = "/api/export/download";
        a.download = "";
        a.click();
      }
    } catch (err) {
      setLog(`${text}\n${err instanceof Error ? err.message : err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {log !== null && !busy ? (
        <p className="text-[12px] text-destructive">Export status</p>
      ) : null}

      {log !== null ? (
        <pre
          ref={logRef}
          className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-2 font-mono text-[10px] leading-relaxed text-muted-foreground"
        >
          {log || "Starting…"}
        </pre>
      ) : null}

      <Button
        size="lg"
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold shadow-md hover:shadow-xl transition-all duration-200 py-3"
        onClick={() => void exportBrowserZip()}
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2Icon className="animate-spin size-4" />
            <span>Exporting Pack…</span>
          </>
        ) : (
          <>
            <DownloadIcon className="size-4" />
            <span>Download Store Pack (.ZIP)</span>
          </>
        )}
      </Button>
    </div>
  );
}
