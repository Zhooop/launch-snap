import { useState } from "react";
import {
  BookOpen,
  X,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Play,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import logoImg from "../assets/logo.png";

interface GuidesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeviceType?: (type: "iphone" | "ipad" | "android") => void;
}

export function GuidesModal({ isOpen, onClose, onSelectDeviceType }: GuidesModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "ios" | "android" | "comparison">("all");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const guides = [
    {
      id: "ios-sizes",
      category: "ios",
      badge: "iOS 18 & 2026 Updated",
      title: "App Store Screenshot Sizes & Guidelines (2026)",
      desc: "Verified dimensions for iPhone 16 Pro Max (6.9\"), 15 Pro Max (6.7\"), iPad Pro 13\", and Apple Connect submission rules.",
      link: "/guides-app-store-screenshot-sizes-2026.html",
      specs: [
        { label: 'iPhone 6.9" (16 Pro Max)', value: "1320 × 2868 px" },
        { label: 'iPhone 6.7" (15 Pro Max)', value: "1290 × 2796 px" },
        { label: 'iPhone 6.3" (16 Pro)', value: "1206 × 2622 px" },
        { label: 'iPad Pro 13" (M4)', value: "2064 × 2752 px" },
      ],
      ctaDevice: "iphone" as const,
    },
    {
      id: "android-sizes",
      category: "android",
      badge: "Google Play Console",
      title: "Google Play Store Screenshot Requirements & Sizes",
      desc: "Recommended aspect ratios, tablet 7-inch & 10-inch requirements for store featuring, and 8 MB file size cap.",
      link: "/guides-google-play-screenshot-requirements.html",
      specs: [
        { label: "Modern Android (9:19.5)", value: "1080 × 2340 px" },
        { label: "Standard HD (9:16)", value: "1080 × 1920 px" },
        { label: "Large Tablet (10-inch)", value: "1600 × 2560 px" },
        { label: "Compact Tablet (7-inch)", value: "1200 × 1920 px" },
      ],
      ctaDevice: "android" as const,
    },
    {
      id: "alternatives",
      category: "comparison",
      badge: "Tool Benchmark",
      title: "Best Free Alternative to AppScreens & Previewed in 2026",
      desc: "Why mobile developers and indie hackers choose LaunchSnap over paid subscription tools with watermarks and export limits.",
      link: "/blog-appscreens-previewed-alternative.html",
      specs: [
        { label: "Store Live Simulator", value: "Built-in & Free" },
        { label: "Continuous Panoramas", value: "Automatic" },
        { label: "ZIP Export Limit", value: "Unlimited" },
        { label: "Account / Sign-up", value: "Not Required" },
      ],
      ctaDevice: "iphone" as const,
    },
  ];

  const filteredGuides = guides.filter((g) => {
    const matchCategory = activeTab === "all" || g.category === activeTab;
    const matchSearch =
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="LaunchSnap Developer Guides & Resources Hub"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-6">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="LaunchSnap"
              className="size-9 rounded-xl shadow-xs ring-1 ring-border/50 object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Developer Guides & SEO Resources</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  2026 Cheatsheets
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                App Store & Google Play dimensions, requirements, and conversion tips.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Filter bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/30 px-6 py-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Resources
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ios")}
              className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === "ios"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="size-3" />
              <span>Apple App Store</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("android")}
              className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === "android"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Play className="size-3" />
              <span>Google Play</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("comparison")}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                activeTab === "comparison"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Comparisons
            </button>
          </div>

          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search guides & specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56 rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Guides Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              className="flex flex-col md:flex-row gap-5 rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition hover:border-primary/50"
            >
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                    {guide.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold leading-snug">{guide.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{guide.desc}</p>

                {/* Quick specs pill row */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {guide.specs.map((spec) => (
                    <button
                      key={spec.label}
                      type="button"
                      onClick={() => copyToClipboard(spec.value)}
                      title="Click to copy dimension"
                      className="group flex flex-col rounded-lg border border-border/60 bg-muted/40 p-2 text-left transition hover:border-primary/50 hover:bg-muted/70"
                    >
                      <span className="text-[10px] text-muted-foreground truncate">{spec.label}</span>
                      <div className="mt-0.5 flex items-center justify-between text-xs font-mono font-bold text-foreground">
                        <span className="truncate">{spec.value}</span>
                        {copiedText === spec.value ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3 opacity-0 group-hover:opacity-60 transition" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-row md:flex-col items-center justify-end md:justify-center gap-2.5 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-5">
                <a
                  href={guide.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted"
                >
                  <span>Full Article</span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectDeviceType && guide.ctaDevice) {
                      onSelectDeviceType(guide.ctaDevice);
                    }
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Quick SEO Tip Banner */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="size-4" />
              <span>SEO & Conversion Pro-Tip:</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Google Play & Apple App Store ranking algorithms consider listing conversion rate (CVR) as a primary search weight. High-contrast headlines and localized screenshots increase download velocity by up to 34%.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition underline underline-offset-4"
            >
              sitemap.xml
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition underline underline-offset-4"
            >
              robots.txt
            </a>
          </div>
          <span>LaunchSnap SEO Knowledge Base</span>
        </footer>
      </div>
    </div>
  );
}
