import { useState, useRef, useEffect, useId, type ChangeEvent, type DragEvent } from "react";
import { UploadCloud, Link as LinkIcon, Image as ImageIcon, ImageOff, Loader2, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/cn";
import { uploadsApi } from "@/api/endpoints/uploads";
import { Button } from "./Button";
import { Input } from "./Input";

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  folder?: "products" | "livestock" | "farms" | "profiles" | "crops";
  maxSizeMB?: number;
  className?: string;
}

const ALLOWED_EXTENSIONS = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export function ImageUploader({
  value = "",
  onChange,
  label = "Product image",
  hint = "Upload a photo or provide an image link (JPG, PNG, WebP up to 5 MB)",
  error,
  disabled = false,
  folder = "products",
  maxSizeMB = 5,
  className,
}: ImageUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine initial mode: If value is an existing external URL (not blob/uploads) or empty, default to upload
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState(value);
  const [previewError, setPreviewError] = useState(false);
  const [objectPreview, setObjectPreview] = useState<string | null>(null);

  // Sync internal urlInput with external value
  useEffect(() => {
    setUrlInput(value || "");
    setPreviewError(false);
  }, [value]);

  // Clean up object URL memory leak
  useEffect(() => {
    return () => {
      if (objectPreview) {
        URL.revokeObjectURL(objectPreview);
      }
    };
  }, [objectPreview]);

  const activeDisplayUrl = objectPreview || value;

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_EXTENSIONS.includes(file.type.toLowerCase())) {
      toast.error("Please upload a JPG, PNG, or WEBP image.");
      return false;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Image must be smaller than ${maxSizeMB} MB.`);
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    // Create temporary preview immediately
    const tempObjUrl = URL.createObjectURL(file);
    if (objectPreview) URL.revokeObjectURL(objectPreview);
    setObjectPreview(tempObjUrl);
    setPreviewError(false);
    setIsUploading(true);

    try {
      const res = await uploadsApi.uploadImage(file, folder);
      if (res?.url) {
        onChange(res.url);
        setUrlInput(res.url);
        toast.success("Image uploaded successfully.");
      } else {
        throw new Error("Upload response missing URL");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to upload image. Please try again.";
      toast.error(msg);
      // Revert object preview if upload failed and no prior value
      if (!value) {
        setObjectPreview(null);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    setPreviewError(false);
    if (!val.trim()) {
      onChange("");
      return;
    }
    const clean = val.trim();
    // Validate scheme
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      onChange(clean);
    } else {
      onChange(clean); // Form resolver will also flag if invalid
    }
  };

  const handleRemove = () => {
    if (objectPreview) {
      URL.revokeObjectURL(objectPreview);
      setObjectPreview(null);
    }
    setUrlInput("");
    setPreviewError(false);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-800">
            {label}
          </label>
          <span className="text-xs text-ink-500 font-normal">
            {mode === "upload" ? "Upload mode" : "URL mode"}
          </span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex rounded-lg border border-border bg-surface-sunk p-1 w-full sm:w-fit gap-1">
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => setMode("upload")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all",
            mode === "upload"
              ? "bg-surface text-primary-700 shadow-sm border border-border"
              : "text-ink-600 hover:text-ink-900"
          )}
        >
          <UploadCloud className="size-3.5" aria-hidden="true" />
          Upload Image
        </button>
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => setMode("url")}
          className={cn(
            "flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-all",
            mode === "url"
              ? "bg-surface text-primary-700 shadow-sm border border-border"
              : "text-ink-600 hover:text-ink-900"
          )}
        >
          <LinkIcon className="size-3.5" aria-hidden="true" />
          Use Image URL
        </button>
      </div>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        id={inputId}
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={onFileInputChange}
        className="sr-only"
        disabled={disabled || isUploading}
        aria-label="Upload an image file"
      />

      {/* UPLOAD MODE */}
      {mode === "upload" && (
        <div className="space-y-3">
          {!activeDisplayUrl ? (
            /* Empty Drop Zone */
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary-500 bg-primary-50/40"
                  : "border-border hover:border-primary-400 hover:bg-surface-sunk/50",
                disabled && "opacity-60 cursor-not-allowed",
                isUploading && "pointer-events-none"
              )}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary-600" aria-hidden="true" />
                  <p className="text-sm font-medium text-ink-800">Uploading image...</p>
                  <p className="text-xs text-ink-500">Please wait while image is stored safely.</p>
                </div>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-3">
                    <UploadCloud className="size-6" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-ink-900">
                    <span className="text-primary-700 underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    JPG, PNG, or WebP up to {maxSizeMB} MB
                  </p>
                </>
              )}
            </div>
          ) : (
            /* Uploaded Preview Card */
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-border bg-surface p-3">
              <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-sunk">
                {!previewError ? (
                  <img
                    src={activeDisplayUrl}
                    alt="Preview"
                    className="size-full object-cover"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <ImageOff className="size-6 text-danger-500 mb-1" aria-hidden="true" />
                    <span className="text-[10px] text-danger-700">Preview error</span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white backdrop-blur-[1px]">
                    <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-success-700">
                  <ImageIcon className="size-3.5" aria-hidden="true" />
                  <span>{isUploading ? "Uploading image..." : "Image ready"}</span>
                </div>
                <p className="text-xs text-ink-500 truncate max-w-full font-mono">
                  {activeDisplayUrl}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <RefreshCw className="mr-1.5 size-3.5" aria-hidden="true" />
                    Change image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled || isUploading}
                    className="text-danger-600 hover:bg-danger-50"
                    onClick={handleRemove}
                  >
                    <X className="mr-1.5 size-3.5" aria-hidden="true" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL MODE */}
      {mode === "url" && (
        <div className="space-y-3">
          <Input
            placeholder="https://images.unsplash.com/…"
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={disabled || isUploading}
            error={error}
            hint="Paste a direct image URL (https://...)"
          />

          {urlInput.trim() && (
            <div className="flex items-start gap-4 rounded-lg border border-border bg-surface p-3">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-sunk">
                {!previewError ? (
                  <img
                    src={urlInput.trim()}
                    alt="URL Preview"
                    className="size-full object-cover"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <ImageOff className="size-6 text-danger-500 mb-1" aria-hidden="true" />
                    <span className="text-[10px] text-danger-700">Broken URL</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1">
                {previewError ? (
                  <p className="text-xs font-medium text-danger-700">
                    Unable to load image from this URL. Please ensure it is a valid, publicly accessible image.
                  </p>
                ) : (
                  <p className="text-xs font-medium text-success-700">
                    URL preview loaded successfully.
                  </p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-danger-600 hover:bg-danger-50 mt-1"
                  onClick={handleRemove}
                >
                  <X className="mr-1.5 size-3.5" aria-hidden="true" />
                  Clear URL
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Error or Hint */}
      {error && <p className="text-sm text-danger-700">{error}</p>}
      {!error && hint && <p className="text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

