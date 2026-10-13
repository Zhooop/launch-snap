import {
  BookOpen,
  CameraIcon,
  type LucideIcon,
  SmartphoneIcon,
  TabletIcon,
  TriangleAlertIcon,
  UploadIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { Sidebar } from "./components/Sidebar";
import { Strip, type StripView } from "./components/Strip";
import { StoreSimulatorModal } from "./components/StoreSimulatorModal";
import { GuidesModal } from "./components/GuidesModal";
import { useHistory } from "./lib/useHistory";
import {
  type BundledFont,
  type Design,
  type DesignScene,
  type DeviceCaptures,
  type DeviceEntry,
  type DeviceType,
  loadDesign,
  loadManifest,
  ManifestError,
  type SavedDesign,
  type SceneCopy,
  type StoreManifest,
  saveDesign,
} from "./manifest";

/** Sentinel for the config's own layout sequence, which the studio can show but not edit. */
export const CUSTOM_TEMPLATE = "__custom__";

const DEVICE_TYPES: DeviceType[] = ["iphone", "ipad", "android"];

/**
 * Shown when a device-type tab is selected but its device is not in the
 * config. The chip holds the ask to hand a coding agent, which knows the
 * config changes and capture steps from the goldie skill.
 */
const ENABLE_DEVICE_TYPE: Record<
  DeviceType,
  { icon: LucideIcon; title: string; body: string; command: string }
> = {
  iphone: {
    icon: SmartphoneIcon,
    title: "No App Store screenshots yet",
    body: "Ask your coding agent to set them up:",
    command: "create App Store screenshots using goldie",
  },
  ipad: {
    icon: TabletIcon,
    title: "No iPad screenshots yet",
    body: 'Add "ipad-13" to devices in goldie.config.ts, or ask your coding agent:',
    command: "add iPad screenshots using goldie",
  },
  android: {
    icon: SmartphoneIcon,
    title: "No Google Play screenshots yet",
    body: "Ask your coding agent to set them up:",
    command: "create Google Play screenshots using goldie",
  },
};

/** How long the design must sit still before it is written to disk. */
const SAVE_DEBOUNCE_MS = 500;

export function App() {
  const [loaded, setLoaded] = useState<{ manifest: StoreManifest; design: SavedDesign } | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    Promise.all([loadManifest(), loadDesign()])
      .then(([manifest, design]) => setLoaded({ manifest, design }))
      .catch((e: Error) => setError(e));
  }, []);

  if (error)
    return (
      <EmptyState
        icon={TriangleAlertIcon}
        title="The studio could not load"
        body={error.message}
        command={error instanceof ManifestError ? error.command : undefined}
      />
    );
  if (!loaded) return null;
  return <Loaded manifest={loaded.manifest} saved={loaded.design} />;
}

/**
 * All design state lives here as plain React state: the strip composites the
 * scenes in the browser, so a background or frame change repaints instantly.
 * The CLI only runs when the sidebar's Export button asks for the final files.
 *
 * Two things survive a reload. The design choices (background, frame, font,
 * layout and screen-only mode, per-scene layout overrides, copy edited in the
 * lightbox, the order tiles were dragged into)
 * are written to goldie.design.json next to the config, debounced, so the
 * CLI picks them up too. The view choices (device type, device, locale, dark) only matter
 * here and live in localStorage under the app's name, as does the strip view. Either falls back to
 * the config when a stored value no longer applies (a device or frame
 * variant removed from the config, for instance).
 */
const DEFAULT_DEVICES: DeviceEntry[] = [
  {
    key: "iphone-6.9",
    label: "6.9",
    platform: "ios",
    type: "iphone",
    copyScale: 1,
    simulatorName: "iPhone 17 Pro Max",
    screenshot: { width: 1320, height: 2868 },
    preview: { width: 886, height: 1920 },
    frame: null,
  },
  {
    key: "pixel-10-pro",
    label: "Play phone",
    platform: "android",
    type: "android",
    copyScale: 1,
    simulatorName: null,
    screenshot: { width: 1080, height: 1920 },
    preview: { width: 1080, height: 2400 },
    frame: {
      url: "frames/pixel-10-pro.webp",
      geom: {
        width: 1410,
        height: 2968,
        screen: { x: 59, y: 60, width: 1280, height: 2856 },
        screenRadius: 178,
      },
    },
  },
  {
    key: "ipad-13",
    label: "13",
    platform: "ios",
    type: "ipad",
    copyScale: 1.3,
    simulatorName: "iPad Pro 13-inch (M4)",
    screenshot: { width: 2064, height: 2752 },
    preview: { width: 1200, height: 1600 },
    frame: null,
  },
];

function Loaded({ manifest, saved }: { manifest: StoreManifest; saved: SavedDesign }) {
  const design = manifest.design;
  const view = loadView(manifest.app.name);

  const allDevices: DeviceEntry[] = DEFAULT_DEVICES.map((d) => {
    const found = manifest.devices.find((m) => m.key === d.key);
    return found ? { ...d, ...found } : d;
  });

  const initialType: DeviceType = isDeviceType(view.platform)
    ? view.platform
    : (allDevices.find((d) => d.key === view.device)?.type ?? "iphone");
  const [deviceType, setDeviceType] = useState(initialType);
  const [device, setDevice] = useState(() => {
    const devices = allDevices.filter((d) => d.type === initialType);
    return devices.some((d) => d.key === view.device)
      ? (view.device as string)
      : (devices[0]?.key ?? "iphone-6.9");
  });
  const selectDeviceType = (t: DeviceType) => {
    setDeviceType(t);
    const devices = allDevices.filter((d) => d.type === t);
    if (devices.length > 0) setDevice(devices[0]!.key);
  };
  const [locale, setLocale] = useState(
    view.locale && manifest.locales.includes(view.locale)
      ? view.locale
      : (manifest.locales[0] ?? ""),
  );
  const [dark, setDark] = useState(
    new URLSearchParams(window.location.search).get("dark") === "1" || view.dark === true,
  );
  const [stripView, setStripView] = useState<StripView>(view.view === "grid" ? "grid" : "strip");
  const knownLayout = (key: string | undefined) =>
    key && design.layouts.some((l) => l.key === key) ? key : undefined;
  const { state, set } = useHistory<DesignState>(() => ({
    background: saved.background ?? design.theme.background,
    frames: initialFrames(design, saved),
    fontFamily: saved.fontFamily ?? design.theme.fontFamily,
    copy: saved.copy ?? {},
    layout: knownLayout(saved.layout) ?? design.layout,
    template: initialTemplate(design, saved),
    screenOnly: saved.screenOnly ?? design.screenOnly,
    sceneLayouts: initialSceneLayouts(design, saved, knownLayout),
    order: initialOrder(design, saved),
  }));
  const {
    background,
    frames,
    fontFamily,
    copy,
    layout,
    template,
    screenOnly,
    sceneLayouts,
    order,
  } = state;
  // Each setter names its field so a burst of edits to one control (a drag
  // on the gradient picker) collapses into a single undo step.
  const field =
    <K extends keyof DesignState>(key: K) =>
    (value: DesignState[K]) =>
      set(key, (prev) => ({ ...prev, [key]: value }));
  const setBackground = field("background");
  // The frame picker edits the variant of the device on show; "" means custom art.
  const frame = frames[device] ?? "";
  const setFrame = (value: string) =>
    set(`frame:${device}`, (prev) => ({ ...prev, frames: { ...prev.frames, [device]: value } }));
  const setFontFamily = field("fontFamily");
  const setLayout = field("layout");
  // Picking a template replaces the strip's layout sequence, so any per-scene
  // overrides made against the previous one are dropped with it.
  const setTemplate = (value: string) =>
    set("template", (prev) => ({ ...prev, template: value, sceneLayouts: {} }));
  const setScreenOnly = field("screenOnly");
  const setOrder = field("order");
  // Per-scene layout overrides; a scene absent there follows the default above.
  const setSceneLayout = (sceneId: string, key: string | undefined) =>
    set("sceneLayouts", (prev) => {
      const next = { ...prev.sceneLayouts };
      if (key) next[sceneId] = key;
      else delete next[sceneId];
      return { ...prev, sceneLayouts: next };
    });
  const setSceneCopy = (sceneId: string, fieldName: "headline" | "subhead", text: string) =>
    set(`copy:${sceneId}:${fieldName}`, (prev) => ({
      ...prev,
      copy: {
        ...prev.copy,
        [sceneId]: {
          ...prev.copy[sceneId],
          [fieldName]: { ...prev.copy[sceneId]?.[fieldName], [locale]: text },
        },
      },
    }));

  useEffect(() => {
    storeView(manifest.app.name, { platform: deviceType, device, locale, dark, view: stripView });
  }, [manifest.app.name, deviceType, device, locale, dark, stripView]);

  // Write the design to disk once it has sat still for a moment; a drag on
  // the gradient picker fires many changes a second. Skips the initial mount
  // so opening the studio never creates the file by itself. An empty frame
  // means the config's custom bezel art, which has nothing to save.
  const [saveError, setSaveError] = useState<string | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      const chosen = Object.fromEntries(Object.entries(frames).filter(([, v]) => v));
      saveDesign({
        background,
        frames: Object.keys(chosen).length > 0 ? chosen : undefined,
        fontFamily,
        copy: Object.keys(copy).length > 0 ? copy : undefined,
        order: order.length > 0 ? order : undefined,
        template: template === CUSTOM_TEMPLATE ? undefined : template,
        layout,
        screenOnly,
        sceneLayouts: Object.keys(sceneLayouts).length > 0 ? sceneLayouts : undefined,
      }).then(
        () => setSaveError(null),
        (e: Error) => setSaveError(e.message),
      );
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [background, frames, fontFamily, copy, order, template, layout, screenOnly, sceneLayouts]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // The bundled typefaces' @font-face rules, declared once in <head>.
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = fontFaces(design.fonts);
    document.head.append(style);
    return () => style.remove();
  }, [design.fonts]);

  // The exporter appends the bundled fallback typefaces as per-glyph last
  // resorts, so the preview does the same; otherwise the browser would silently
  // substitute a system font for characters the chosen stack cannot draw - and
  // the preview would look right where the export does not. Only the bare stack
  // is saved to goldie.design.json.
  const previewFontFamily = ["noto-sans-sc", "noto-sans-arabic"].reduce((stack, key) => {
    const font = design.fonts.find((f) => f.key === key);
    return font && !stack.includes(font.family) ? `${stack}, "${font.family}"` : stack;
  }, fontFamily);

  const [dynamicScenes, setDynamicScenes] = useState<DesignScene[]>(manifest.design.scenes);
  const [dynamicCaptures, setDynamicCaptures] = useState<Record<string, DeviceCaptures>>(manifest.design.captures);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [isStoreSimulatorOpen, setIsStoreSimulatorOpen] = useState(false);
  const [isGuidesOpen, setIsGuidesOpen] = useState(false);

  const handleUploadScreenshot = (sceneId: string, file: File) => {
    const url = URL.createObjectURL(file);
    setDynamicCaptures((prev) => {
      const next = { ...prev };
      for (const dev of allDevices) {
        const devCaps = next[dev.key] || { screenshots: [], clips: null };
        const existingIdx = devCaps.screenshots.findIndex((s) => s.sceneId === sceneId);
        const updatedScreenshots = [...devCaps.screenshots];
        if (existingIdx >= 0) {
          updatedScreenshots[existingIdx] = { sceneId, url };
        } else {
          updatedScreenshots.push({ sceneId, url });
        }
        next[dev.key] = { ...devCaps, screenshots: updatedScreenshots };
      }
      return next;
    });
  };

  const handleAddScene = () => {
    const newId = `screen-${Date.now().toString().slice(-4)}`;
    const newScene: DesignScene = {
      id: newId,
      headline: { [locale]: "Captivating Feature Headline" },
      subhead: { [locale]: "Highlight key benefit for your users." },
    };
    setDynamicScenes((prev) => [...prev, newScene]);
    setDynamicCaptures((prev) => {
      const next = { ...prev };
      for (const dev of allDevices) {
        const devCaps = next[dev.key] || { screenshots: [], clips: null };
        const sampleUrl =
          devCaps.screenshots[0]?.url ||
          next["pixel-10-pro"]?.screenshots[0]?.url ||
          next["iphone-6.9"]?.screenshots[0]?.url ||
          next["ipad-13"]?.screenshots[0]?.url ||
          Object.values(next)[0]?.screenshots[0]?.url ||
          "";

        const newByLocale = devCaps.byLocale
          ? Object.fromEntries(
              Object.entries(devCaps.byLocale).map(([locKey, locVal]) => [
                locKey,
                {
                  ...locVal,
                  screenshots: [...locVal.screenshots, { sceneId: newId, url: sampleUrl }],
                },
              ]),
            )
          : undefined;

        next[dev.key] = {
          ...devCaps,
          screenshots: [...devCaps.screenshots, { sceneId: newId, url: sampleUrl }],
          ...(newByLocale ? { byLocale: newByLocale } : {}),
        };
      }
      return next;
    });
    set("order", (prev) =>
      prev.order && prev.order.length > 0 ? { ...prev, order: [...prev.order, newId] } : prev,
    );
  };

  const handleDeleteScene = (sceneId: string) => {
    setDynamicScenes((prev) => prev.filter((s) => s.id !== sceneId));
    setDynamicCaptures((prev) => {
      const next = { ...prev };
      for (const dev of allDevices) {
        const devCaps = next[dev.key];
        if (devCaps) {
          const newByLocale = devCaps.byLocale
            ? Object.fromEntries(
                Object.entries(devCaps.byLocale).map(([locKey, locVal]) => [
                  locKey,
                  {
                    ...locVal,
                    screenshots: locVal.screenshots.filter((s) => s.sceneId !== sceneId),
                  },
                ]),
              )
            : undefined;

          next[dev.key] = {
            ...devCaps,
            screenshots: devCaps.screenshots.filter((s) => s.sceneId !== sceneId),
            ...(newByLocale ? { byLocale: newByLocale } : {}),
          };
        }
      }
      return next;
    });
    set("order", (prev) => ({
      ...prev,
      order: prev.order.filter((id) => id !== sceneId),
    }));
  };

  const handleDuplicateScene = (sceneId: string) => {
    const source = dynamicScenes.find((s) => s.id === sceneId);
    if (!source) return;
    const newId = `${sceneId}-copy-${Date.now().toString().slice(-4)}`;
    const newScene: DesignScene = {
      ...source,
      id: newId,
      headline: { ...source.headline },
      subhead: source.subhead ? { ...source.subhead } : undefined,
    };
    setDynamicScenes((prev) => [...prev, newScene]);
    setDynamicCaptures((prev) => {
      const next = { ...prev };
      for (const dev of allDevices) {
        const devCaps = next[dev.key] || { screenshots: [], clips: null };
        const cap = devCaps.screenshots.find((s) => s.sceneId === sceneId);
        const urlToUse = cap?.url || devCaps.screenshots[0]?.url || "";

        const newByLocale = devCaps.byLocale
          ? Object.fromEntries(
              Object.entries(devCaps.byLocale).map(([locKey, locVal]) => {
                const locCap = locVal.screenshots.find((s) => s.sceneId === sceneId);
                return [
                  locKey,
                  {
                    ...locVal,
                    screenshots: [
                      ...locVal.screenshots,
                      { sceneId: newId, url: locCap?.url || urlToUse },
                    ],
                  },
                ];
              }),
            )
          : undefined;

        next[dev.key] = {
          ...devCaps,
          screenshots: [...devCaps.screenshots, { sceneId: newId, url: urlToUse }],
          ...(newByLocale ? { byLocale: newByLocale } : {}),
        };
      }
      return next;
    });
    set("order", (prev) =>
      prev.order && prev.order.length > 0 ? { ...prev, order: [...prev.order, newId] } : prev,
    );
  };

  const handleBatchUpload = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    fileList.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      const sceneId = `screen-${Date.now().toString().slice(-4)}-${idx + 1}`;
      setDynamicScenes((prev) => [
        ...prev,
        {
          id: sceneId,
          headline: { [locale]: `Feature Spotlight ${idx + 1}` },
          subhead: { [locale]: "Fast, smooth, and designed for you." },
        },
      ]);
      setDynamicCaptures((prev) => {
        const next = { ...prev };
        for (const dev of allDevices) {
          const devCaps = next[dev.key] || { screenshots: [], clips: null };
          next[dev.key] = {
            ...devCaps,
            screenshots: [...devCaps.screenshots, { sceneId, url }],
          };
        }
        return next;
      });
    });
  };

  const typeDevices = allDevices.filter((d) => d.type === deviceType);
  const spec = typeDevices.find((d) => d.key === device) ?? typeDevices[0] ?? allDevices[0];
  const deviceCaptures = spec
    ? (dynamicCaptures[spec.key]?.screenshots?.length
        ? dynamicCaptures[spec.key]
        : dynamicCaptures["pixel-10-pro"] ?? dynamicCaptures["iphone-6.9"] ?? Object.values(dynamicCaptures)[0])
    : undefined;
  // With localizedCaptures a locale shows only its own captures: falling back to
  // another locale's would put the wrong language on screen.
  const captures = deviceCaptures?.byLocale ? deviceCaptures.byLocale[locale] : deviceCaptures;
  const missingLocale = Boolean(deviceCaptures?.byLocale) && !captures;
  const firstVariant = design.frameVariants.find((v) => v.device === spec.key)?.key;
  const frameUrl = frame
    ? `frames/${frame}.png`
    : (design.customFrameUrl ?? `frames/${firstVariant ?? design.frameVariants[0]?.key}.png`);

  return (
    <div
      className="relative flex h-full bg-stage p-3 text-foreground"
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) setIsWindowDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsWindowDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsWindowDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleBatchUpload(e.dataTransfer.files);
        }
      }}
    >
      {isWindowDragging ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm">
          <div className="flex flex-col items-center rounded-3xl border-2 border-primary bg-background/95 p-10 shadow-2xl">
            <UploadIcon className="size-12 text-primary animate-bounce" />
            <h3 className="mt-4 text-xl font-bold">Drop Mobile Screenshots Here</h3>
            <p className="mt-1 text-sm text-muted-foreground">PNG, JPG, or WebP</p>
          </div>
        </div>
      ) : null}

      <Sidebar
        manifest={{ ...manifest, devices: allDevices }}
        deviceType={deviceType}
        device={spec.key}
        locale={locale}
        dark={dark}
        onDeviceType={selectDeviceType}
        onDevice={setDevice}
        onLocale={setLocale}
        onDark={setDark}
        view={stripView}
        onView={setStripView}
        background={background}
        frame={frame}
        frames={frames}
        fontFamily={fontFamily}
        template={template}
        layout={layout}
        screenOnly={screenOnly}
        onBackground={setBackground}
        onFrame={setFrame}
        onFontFamily={setFontFamily}
        onTemplate={setTemplate}
        onLayout={setLayout}
        onScreenOnly={setScreenOnly}
        onUploadScreenshots={handleBatchUpload}
        onAddScene={handleAddScene}
        onOpenStoreSimulator={() => setIsStoreSimulatorOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sleek Stage Header Bar */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/40 bg-stage/60 px-5 backdrop-blur-xs select-none">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              {spec.platform === "ios"
                ? spec.type === "ipad"
                  ? "iPadOS App Store"
                  : "Apple App Store"
                : "Google Play Store"}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {deviceLabel(spec)} ({spec.screenshot.width} × {spec.screenshot.height} px)
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="rounded-md bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {dynamicScenes.length} {dynamicScenes.length === 1 ? "Scene" : "Scenes"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <span className="hidden lg:inline text-[11px]">
              ✨ Drag tiles to reorder • Double-click text to customize
            </span>
            <button
              type="button"
              onClick={() => setIsGuidesOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:bg-muted shadow-2xs"
            >
              <BookOpen className="size-3 text-primary" />
              <span>Guides & SEO Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setIsStoreSimulatorOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/20 shadow-2xs"
            >
              <span>Preview in Store</span>
            </button>
          </div>
        </div>

        <main className="relative grid min-h-0 flex-1 place-items-center-safe overflow-auto p-10">
          {spec && (captures || dynamicScenes.length > 0) ? (
            <div className="w-full max-w-[1400px]">
              <Strip
                design={{ ...design, scenes: dynamicScenes }}
                captures={captures ?? { screenshots: [], clips: null }}
                spec={spec}
                locale={locale}
                background={background}
                frameUrl={frameUrl}
                fontFamily={previewFontFamily}
                copy={copy}
                onCopy={setSceneCopy}
                order={order}
                onReorder={setOrder}
                template={
                  template === CUSTOM_TEMPLATE && Array.isArray(design.template)
                    ? design.template
                    : template
                }
                layout={layout}
                screenOnly={screenOnly}
                sceneLayouts={sceneLayouts}
                onSceneLayout={setSceneLayout}
                view={stripView}
                onUploadScreenshot={handleUploadScreenshot}
                onAddScene={handleAddScene}
                onDeleteScene={handleDeleteScene}
                onDuplicateScene={handleDuplicateScene}
              />
            </div>
          ) : spec ? (
            <EmptyState
              icon={CameraIcon}
              title={
                missingLocale
                  ? `No ${locale} screenshots for the ${deviceLabel(spec)} yet`
                  : `No screenshots for the ${deviceLabel(spec)} yet`
              }
              body="Drop your mobile screenshots here or choose them to get started instantly:"
              onUploadFiles={handleBatchUpload}
            />
          ) : (
            <EmptyState {...ENABLE_DEVICE_TYPE[deviceType]} />
          )}
        </main>
      </div>

      {saveError ? <Toast message={`Could not save design: ${saveError}`} /> : null}

      <StoreSimulatorModal
        isOpen={isStoreSimulatorOpen}
        onClose={() => setIsStoreSimulatorOpen(false)}
        manifest={manifest}
        scenes={dynamicScenes}
        captures={dynamicCaptures}
        background={background}
        deviceType={deviceType}
        copy={copy}
        locale={locale}
        order={order}
        fontFamily={previewFontFamily}
      />

      <GuidesModal
        isOpen={isGuidesOpen}
        onClose={() => setIsGuidesOpen(false)}
        onSelectDeviceType={selectDeviceType}
      />
    </div>
  );
}

/** Everything the undo stack tracks: the design choices saved to goldie.design.json. */
type DesignState = {
  background: string;
  /** Bezel variant per device key; "" or absent means the config's custom art. */
  frames: Record<string, string>;
  fontFamily: string;
  copy: Record<string, SceneCopy>;
  layout: string;
  /** A built-in template key, "" for none, or CUSTOM_TEMPLATE for the config's own sequence. */
  template: string;
  screenOnly: boolean;
  /** Per-scene layout overrides; a scene absent here follows `layout`. */
  sceneLayouts: Record<string, string>;
  /** Screenshot scene ids as arranged by dragging tiles; empty means the config's order. */
  order: string[];
};

/** The saved variant per device when it is drawn for that device, else the config's. */
function initialFrames(design: Design, saved: SavedDesign): Record<string, string> {
  const known = (device: string, key: string | undefined) =>
    key && design.frameVariants.some((v) => v.key === key && v.device === device) ? key : undefined;
  const out: Record<string, string> = {};
  for (const [device, variant] of Object.entries(design.frames)) {
    const legacy = design.frameVariants.find((v) => v.key === saved.frame)?.device;
    const pick =
      known(device, saved.frames?.[device]) ??
      (legacy === device ? saved.frame : undefined) ??
      variant ??
      "";
    out[device] = pick;
  }
  return out;
}

function initialTemplate(design: Design, saved: SavedDesign): string {
  if (saved.template !== undefined && design.templates.some((t) => t.key === saved.template))
    return saved.template;
  if (saved.template === "") return "";
  if (Array.isArray(design.template)) return CUSTOM_TEMPLATE;
  return design.template ?? "";
}

function initialSceneLayouts(
  design: Design,
  saved: SavedDesign,
  knownLayout: (key: string | undefined) => string | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const scene of design.scenes) {
    const key = knownLayout(saved.sceneLayouts?.[scene.id]);
    if (key) out[scene.id] = key;
  }
  return out;
}

/** Ids no longer in the config are dropped, new ones follow the saved order. */
function initialOrder(design: Design, saved: SavedDesign): string[] {
  const ids = design.scenes.map((s) => s.id);
  if (!saved.order) return [];
  const kept = saved.order.filter((id) => ids.includes(id));
  return [...kept, ...ids.filter((id) => !kept.includes(id))];
}

/** Bottom-center notice; the save retries on the next change, so it needs no dismiss. */
function Toast({ message }: { message: string }) {
  return (
    <output className="animate-in fade-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-destructive/30 bg-popover px-3.5 py-2 text-xs text-destructive shadow-lg duration-200">
      {message}
    </output>
  );
}

type SavedView = {
  /** A DeviceType; older sessions stored the platform ("ios" | "android") here. */
  platform?: string;
  device?: string;
  locale?: string;
  dark?: boolean;
  view?: string;
};

const storageKey = (appName: string) => `goldie-studio:${appName}`;

function isDeviceType(value: string | undefined): value is DeviceType {
  return DEVICE_TYPES.includes(value as DeviceType);
}

function loadView(appName: string): SavedView {
  try {
    const raw = localStorage.getItem(storageKey(appName));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as SavedView) : {};
  } catch {
    return {};
  }
}

function storeView(appName: string, saved: SavedView): void {
  try {
    localStorage.setItem(storageKey(appName), JSON.stringify(saved));
  } catch {
    // Storage may be unavailable (private mode); the session still works.
  }
}

/** @font-face rules for the bundled typefaces the manifest lists. */
function fontFaces(fonts: BundledFont[]): string {
  return fonts
    .flatMap((font) =>
      font.faces.map((face) => {
        const format = face.url.endsWith(".otf") ? "opentype" : "truetype";
        return `@font-face{font-family:"${font.family}";font-weight:${face.weight};font-style:normal;src:url("${face.url}") format("${format}")}`;
      }),
    )
    .join("\n");
}

/** iOS devices are sizes ("iPhone 6.9"), so they carry an inch mark, as in the sidebar. */
function deviceLabel(d: DeviceEntry): string {
  return d.platform === "ios" ? `${d.label}"` : d.label;
}
