import { CheckIcon, CopyIcon, type LucideIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Centered stage placeholder for the states where the strip has nothing to
 * composite: assets not generated, a platform not configured, a device not
 * captured yet. Each names the next CLI step in a copyable command chip.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  command,
  onUploadFiles,
}: {
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  command?: string;
  onUploadFiles?: (files: FileList | File[]) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUploadFiles) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadFiles) {
      onUploadFiles(e.target.files);
    }
  };

  return (
    <div className="grid h-full place-items-center px-10 text-center">
      <div className="flex max-w-md flex-col items-center">
        <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-border bg-background text-muted-foreground shadow-xs">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {body ? (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
        ) : null}

        {onUploadFiles ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-card/50 hover:border-primary/50 hover:bg-card"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Icon className="size-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              Click to upload or drag & drop screenshots
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG or WebP (Portrait phone screens)
            </p>
            <Button size="sm" className="mt-4 pointer-events-none">
              Select Images
            </Button>
          </div>
        ) : null}

        {command ? <CommandChip command={command} /> : null}
      </div>
    </div>
  );
}

/** The command to run next, with a copy button that flashes a check. */
function CommandChip({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = () => {
    navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="mt-4 flex items-center gap-1.5 rounded-lg border border-border bg-background py-1 pr-1 pl-3 shadow-xs">
      <code className="font-mono text-xs text-foreground">{command}</code>
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy command"}
      >
        {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
      </Button>
    </div>
  );
}
