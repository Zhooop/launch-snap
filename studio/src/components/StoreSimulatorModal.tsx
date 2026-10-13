import { useState } from "react";
import {
  X,
  Search,
  Share2,
  ChevronLeft,
  Star,
  Sliders,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import type { StoreManifest, DesignScene, SceneCopy } from "../manifest";
import logoImg from "../assets/logo.png";

interface StoreSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: StoreManifest;
  scenes: DesignScene[];
  captures: Record<string, any>;
  background: string;
  deviceType: "iphone" | "ipad" | "android";
  copy?: Record<string, SceneCopy>;
  locale?: string;
  order?: string[];
  fontFamily?: string;
}

/**
 * Renders a miniature version of the exact marketing card designed on the stage:
 * background color/gradient + headline + subhead + phone bezel + screen capture!
 */
function StoreScreenshotCard({
  item,
  background,
  fontFamily,
  platform = "ios",
  className = "",
}: {
  item: {
    id: string;
    headline: string;
    subhead: string;
    url: string;
  };
  background: string;
  fontFamily?: string;
  platform?: "ios" | "android";
  className?: string;
}) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-xl p-2 text-center shadow-xs border border-black/10 select-none ${className}`}
      style={{
        background,
        aspectRatio: "9 / 19.5",
        fontFamily: fontFamily || "inherit",
      }}
    >
      {/* Top Marketing Copy: Headline + Subhead */}
      <div className="z-10 px-0.5 pt-0.5">
        <div className="text-[7.5px] font-extrabold leading-tight text-white line-clamp-2 drop-shadow-xs">
          {item.headline || "Feature Highlight"}
        </div>
        {item.subhead ? (
          <div className="mt-0.5 text-[5.5px] font-medium leading-tight text-white/80 line-clamp-2">
            {item.subhead}
          </div>
        ) : null}
      </div>

      {/* Embedded Phone Mockup with user's actual screen inside! */}
      <div className="relative mx-auto mt-1 w-[88%] flex-1 overflow-hidden rounded-t-[10px] border-[2px] border-neutral-900 bg-neutral-950 shadow-md ring-1 ring-white/10">
        {/* Notch / Dynamic Island / Camera hole */}
        {platform === "ios" ? (
          <div className="absolute top-0.5 left-1/2 z-20 h-1 w-4 -translate-x-1/2 rounded-full bg-black shadow-xs" />
        ) : (
          <div className="absolute top-0.5 left-1/2 z-20 size-1 -translate-x-1/2 rounded-full bg-black shadow-xs" />
        )}

        {item.url ? (
          <img
            src={item.url}
            alt=""
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-900 p-1 text-center text-[7px] text-neutral-400">
            <span>📱</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function StoreSimulatorModal({
  isOpen,
  onClose,
  manifest,
  scenes,
  captures,
  background,
  deviceType: initialDeviceType,
  copy,
  locale = "en-US",
  order,
  fontFamily,
}: StoreSimulatorModalProps) {
  const [platform, setPlatform] = useState<"ios" | "android">(
    initialDeviceType === "android" ? "android" : "ios",
  );
  const [viewMode, setViewMode] = useState<"search" | "product">("search");
  const [isStoreDark, setIsStoreDark] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Editable simulation metadata
  const [appName, setAppName] = useState(manifest.app?.name || "LaunchSnap App");
  const [appSubtitle, setAppSubtitle] = useState(
    manifest.app?.subtitle?.["en-US"] || "Supercharge your daily mobile productivity",
  );
  const [developerName, setDeveloperName] = useState(manifest.app?.developer || "LaunchSnap Studios");
  const [rating, setRating] = useState(manifest.app?.rating || "4.9");
  const [ratingCount, setRatingCount] = useState(manifest.app?.ratingCount || "3.8K Ratings");
  const [category, setCategory] = useState(manifest.app?.category || "Productivity");
  const [description, setDescription] = useState(
    manifest.app?.description?.["en-US"] ||
      "Create high-converting, professional App Store and Google Play screenshots with instant multi-device bezels, custom typography, and continuous panoramic gradients.",
  );

  if (!isOpen) return null;

  // Resolve screenshot URLs from current captures
  const currentDevKey = platform === "android" ? "pixel-10-pro" : "iphone-6.9";
  const devCaptures = captures[currentDevKey] || Object.values(captures)[0];

  // Respect dragged order if available
  const sortedScenes = order && order.length > 0
    ? [...scenes].sort((a, b) => {
        const idxA = order.indexOf(a.id);
        const idxB = order.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      })
    : scenes;

  const currentLocale = locale || "en-US";
  const screenshotList = sortedScenes.map((scene) => {
    const cap = devCaptures?.screenshots?.find((s: any) => s.sceneId === scene.id);
    const sceneCopy = copy?.[scene.id];
    const headline =
      sceneCopy?.headline?.[currentLocale] ||
      scene.headline?.[currentLocale] ||
      Object.values(sceneCopy?.headline || {})[0] ||
      Object.values(scene.headline || {})[0] ||
      "";
    const subhead =
      sceneCopy?.subhead?.[currentLocale] ||
      scene.subhead?.[currentLocale] ||
      Object.values(sceneCopy?.subhead || {})[0] ||
      Object.values(scene.subhead || {})[0] ||
      "";

    return {
      id: scene.id,
      headline,
      subhead,
      url: cap?.url || "",
    };
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App Store & Google Play Live Simulator"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-border/80 bg-background shadow-2xl">
        {/* Modal Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-6">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="LaunchSnap"
              className="size-9 rounded-xl shadow-xs ring-1 ring-border/50 object-cover"
            />
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Store Live Simulator <span className="text-xs font-normal text-muted-foreground ml-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary">Pre-Submission Preview</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                See exactly how potential users view and discover your app before releasing.
              </p>
            </div>
          </div>

          {/* Controls: Platform, Mode, Theme, Drawer */}
          <div className="flex items-center gap-2.5">
            {/* Platform Toggle */}
            <div className="flex rounded-lg border border-border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setPlatform("ios")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                  platform === "ios"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Apple App Store</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatform("android")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
                  platform === "android"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Google Play</span>
              </button>
            </div>

            {/* View Mode: Search vs Product Page */}
            <div className="flex rounded-lg border border-border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("search")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === "search"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Search Feed
              </button>
              <button
                type="button"
                onClick={() => setViewMode("product")}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  viewMode === "product"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Product Page
              </button>
            </div>

            {/* Dark/Light inside simulator */}
            <button
              type="button"
              onClick={() => setIsStoreDark(!isStoreDark)}
              className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title="Toggle Store Appearance"
            >
              {isStoreDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Edit Details Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                showConfigDrawer
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Sliders className="size-3.5" />
              <span>Edit App Info</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground ml-1"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        {/* Modal Main Body */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Main Simulator Viewport */}
          <div className="flex flex-1 items-center justify-center overflow-y-auto bg-muted/30 p-6">
            {/* Phone Frame Mockup */}
            <div
              className={`relative flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
                platform === "ios"
                  ? "h-[740px] w-[370px] rounded-[52px] border-[10px] border-neutral-900 ring-2 ring-neutral-700/50"
                  : "h-[740px] w-[370px] rounded-[44px] border-[10px] border-neutral-800 ring-2 ring-neutral-700/50"
              } ${isStoreDark ? "bg-black text-white" : "bg-white text-neutral-950"}`}
            >
              {/* iOS Dynamic Island or Android Hole-Punch */}
              {platform === "ios" ? (
                <div className="absolute top-2 left-1/2 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-black shadow-sm" />
              ) : (
                <div className="absolute top-3 left-1/2 z-30 size-3 -translate-x-1/2 rounded-full bg-black shadow-sm" />
              )}

              {/* Status Bar */}
              <div
                className={`relative z-20 flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-xs font-semibold ${
                  isStoreDark ? "text-neutral-200" : "text-neutral-800"
                }`}
              >
                <span>9:41</span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>5G</span>
                  <div className="h-2.5 w-5 rounded-xs border border-current p-0.5">
                    <div className="h-full w-3/4 rounded-2xs bg-current" />
                  </div>
                </div>
              </div>

              {/* Simulated App Store Content */}
              <div className="flex-1 overflow-y-auto pb-6">
                {platform === "ios" ? (
                  /* ================= APPLE APP STORE ================= */
                  viewMode === "search" ? (
                    /* Search Feed View */
                    <div className="p-4 space-y-4">
                      {/* Search Header */}
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xl font-bold tracking-tight">Search</span>
                        <div className="size-7 rounded-full bg-blue-500/20 text-blue-500 grid place-items-center text-xs font-bold">
                          {appName.charAt(0) || "L"}
                        </div>
                      </div>

                      {/* Search Input Box */}
                      <div
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                          isStoreDark ? "bg-neutral-900 text-neutral-300" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        <Search className="size-3.5 text-neutral-400" />
                        <span className="font-normal">{category.toLowerCase()} apps</span>
                      </div>

                      {/* Result Card */}
                      <div
                        className={`rounded-2xl p-4 shadow-xs border transition ${
                          isStoreDark
                            ? "bg-neutral-900/60 border-neutral-800"
                            : "bg-neutral-50/80 border-neutral-200/80"
                        }`}
                      >
                        {/* App Metadata Row */}
                        <div className="flex items-center gap-3">
                          {/* App Icon */}
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-[14px] shadow-md ring-1 ring-black/10">
                            <img src={logoImg} alt={appName} className="size-full object-cover" />
                          </div>

                          {/* App Details */}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-semibold leading-snug">{appName}</h3>
                            <p className="truncate text-xs text-muted-foreground">{appSubtitle}</p>
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <div className="flex items-center text-amber-500">
                                <Star className="size-3 fill-current" />
                                <span className="ml-0.5 font-semibold">{rating}</span>
                              </div>
                              <span>•</span>
                              <span>{ratingCount}</span>
                              <span>•</span>
                              <span className="truncate">{category}</span>
                            </div>
                          </div>

                          {/* GET Button */}
                          <div className="flex flex-col items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              className="rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
                            >
                              GET
                            </button>
                            <span className="text-[8px] text-muted-foreground">In-App Purchases</span>
                          </div>
                        </div>

                        {/* Search Result Screenshots Grid (3-up) */}
                        <div className="mt-3.5 grid grid-cols-3 gap-2">
                          {screenshotList.slice(0, 3).map((item) => (
                            <StoreScreenshotCard
                              key={item.id}
                              item={item}
                              background={background}
                              fontFamily={fontFamily}
                              platform="ios"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Conversion Tip Banner */}
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400">
                        <span className="font-bold">Conversion Insight:</span> 65% of App Store downloads happen directly from this search result screen without opening the details page. Ensure your first 2 screenshots highlight your primary value proposition!
                      </div>
                    </div>
                  ) : (
                    /* App Store Product Detail Page */
                    <div className="p-4 space-y-4">
                      {/* Top Nav */}
                      <div className="flex items-center justify-between text-blue-500 text-xs font-semibold">
                        <div className="flex items-center gap-1">
                          <ChevronLeft className="size-4" />
                          <span>Search</span>
                        </div>
                        <Share2 className="size-4" />
                      </div>

                      {/* Hero Section */}
                      <div className="flex gap-4">
                        <div className="size-20 shrink-0 overflow-hidden rounded-[20px] shadow-lg ring-1 ring-black/10">
                          <img src={logoImg} alt={appName} className="size-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-bold leading-tight">{appName}</h2>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{appSubtitle}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded-full bg-blue-600 px-5 py-1 text-xs font-bold text-white shadow-xs"
                            >
                              GET
                            </button>
                            <span className="text-[9px] text-muted-foreground">In-App Purchases</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Ribbon */}
                      <div
                        className={`grid grid-cols-3 divide-x rounded-xl py-2 text-center text-xs ${
                          isStoreDark
                            ? "bg-neutral-900 divide-neutral-800"
                            : "bg-neutral-100 divide-neutral-200"
                        }`}
                      >
                        <div>
                          <div className="text-[10px] text-muted-foreground font-medium">RATINGS</div>
                          <div className="font-bold flex items-center justify-center gap-0.5 mt-0.5">
                            <span>{rating}</span>
                            <Star className="size-3 fill-amber-500 text-amber-500" />
                          </div>
                          <div className="text-[9px] text-muted-foreground">{ratingCount}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground font-medium">CHART</div>
                          <div className="font-bold mt-0.5">#1</div>
                          <div className="text-[9px] text-muted-foreground">{category}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground font-medium">AGE</div>
                          <div className="font-bold mt-0.5">4+</div>
                          <div className="text-[9px] text-muted-foreground">Years Old</div>
                        </div>
                      </div>

                      {/* Screenshots Gallery Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preview</h4>
                          <span className="text-[10px] text-muted-foreground">{screenshotList.length} Screens</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                          {screenshotList.map((item) => (
                            <StoreScreenshotCard
                              key={item.id}
                              item={item}
                              background={background}
                              fontFamily={fontFamily}
                              platform="ios"
                              className="shrink-0 w-36"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Description Preview */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                          {description}
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  /* ================= GOOGLE PLAY STORE ================= */
                  viewMode === "search" ? (
                    /* Google Play Search View */
                    <div className="p-4 space-y-4">
                      {/* Search Bar */}
                      <div
                        className={`flex items-center justify-between rounded-full px-4 py-2.5 text-xs shadow-xs border ${
                          isStoreDark
                            ? "bg-neutral-900 border-neutral-800 text-neutral-300"
                            : "bg-white border-neutral-200 text-neutral-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Search className="size-3.5 text-neutral-400" />
                          <span>{category.toLowerCase()} apps</span>
                        </div>
                        <div className="size-5 rounded-full bg-emerald-600 text-white grid place-items-center text-[10px] font-bold">
                          {appName.charAt(0)}
                        </div>
                      </div>

                      {/* Google Play Result Card */}
                      <div
                        className={`rounded-2xl p-4 border transition ${
                          isStoreDark ? "bg-neutral-900/60 border-neutral-800" : "bg-neutral-50 border-neutral-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-14 shrink-0 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10">
                            <img src={logoImg} alt={appName} className="size-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold">{appName}</h3>
                            <p className="truncate text-xs text-emerald-600 font-medium">{developerName}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                              <span>{rating} ★</span>
                              <span>•</span>
                              <span>{ratingCount}</span>
                              <span>•</span>
                              <span>100K+ downloads</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                          >
                            Install
                          </button>
                        </div>

                        {/* Google Play Screenshots */}
                        <div className="mt-3.5 grid grid-cols-3 gap-2">
                          {screenshotList.slice(0, 3).map((item) => (
                            <StoreScreenshotCard
                              key={item.id}
                              item={item}
                              background={background}
                              fontFamily={fontFamily}
                              platform="android"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Google Play Product Page */
                    <div className="p-4 space-y-4">
                      <div className="flex gap-4">
                        <div className="size-20 shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-black/10">
                          <img src={logoImg} alt={appName} className="size-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-base font-bold leading-snug">{appName}</h2>
                          <p className="text-xs text-emerald-600 font-semibold">{developerName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Contains ads • In-app purchases</p>
                          <button
                            type="button"
                            className="mt-2.5 w-full rounded-full bg-emerald-600 py-1.5 text-xs font-bold text-white shadow-xs"
                          >
                            Install
                          </button>
                        </div>
                      </div>

                      {/* Google Play Metrics */}
                      <div className="flex items-center justify-around border-y border-border py-2 text-center text-xs">
                        <div>
                          <div className="font-bold flex items-center justify-center gap-0.5">
                            {rating} <Star className="size-3 fill-current text-amber-500" />
                          </div>
                          <div className="text-[9px] text-muted-foreground">{ratingCount}</div>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div>
                          <div className="font-bold">100K+</div>
                          <div className="text-[9px] text-muted-foreground">Downloads</div>
                        </div>
                        <div className="h-6 w-px bg-border" />
                        <div>
                          <div className="font-bold">Everyone</div>
                          <div className="text-[9px] text-muted-foreground">Rated for 3+</div>
                        </div>
                      </div>

                      {/* Screenshots Carousel */}
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground mb-2">Screen previews</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                          {screenshotList.map((item) => (
                            <StoreScreenshotCard
                              key={item.id}
                              item={item}
                              background={background}
                              fontFamily={fontFamily}
                              platform="android"
                              className="shrink-0 w-36"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Home Indicator Bar */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-32 rounded-full bg-neutral-400/60" />
            </div>
          </div>

          {/* Side Drawer: Live Metadata Customizer */}
          {showConfigDrawer && (
            <aside className="w-80 shrink-0 border-l border-border bg-card p-5 overflow-y-auto space-y-4 animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Store Metadata
                </h3>
                <span className="text-[10px] text-primary font-medium">Live sync</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">App Name</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={appSubtitle}
                    onChange={(e) => setAppSubtitle(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Developer Name</label>
                  <input
                    type="text"
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Star Rating</label>
                    <input
                      type="text"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">Reviews Count</label>
                    <input
                      type="text"
                      value={ratingCount}
                      onChange={(e) => setRatingCount(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Primary Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Full Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
                Changes made here immediately reflect in the preview screen without modifying your main design file.
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
