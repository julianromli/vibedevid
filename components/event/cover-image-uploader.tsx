"use client";

import { CheckCircle, Loader2, Upload, X } from "lucide-react";
import { Image } from "@unpic/react";
import { useRef, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadImageOfKind } from "@/lib/image-upload-client";

interface CoverImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

type ImageInputMode = "upload" | "url";

export function CoverImageUploader({
  value,
  onChange,
  onError,
  disabled = false,
}: CoverImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [mode, setMode] = useState<ImageInputMode>("upload");

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      onError("URL gambar tidak boleh kosong");
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
      onChange(imageUrl);
      onError(""); // Clear error
    } catch {
      onError("URL gambar tidak valid");
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    onError("");
    try {
      const { url } = await uploadImageOfKind("events", file);
      onChange(url);
    } catch (error) {
      onError(
        `Gagal mengupload gambar: ${error instanceof Error ? error.message : "Upload failed"}`,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange("");
    setImageUrl("");
    onError("");
  };

  return (
    <div className="space-y-4">
      <Label className="form-label-enhanced">Cover Image *</Label>

      {value ? (
        // Image preview with remove button
        <div className="space-y-4">
          <div className="relative">
            <AspectRatio ratio={16 / 9}>
              <Image
                src={value}
                alt="Event cover preview"
                className="h-full w-full rounded-lg object-cover shadow-md"
                width={800}
                height={450}
              />
            </AspectRatio>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-green-600 text-sm dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Image uploaded successfully!</span>
          </div>
        </div>
      ) : (
        // Upload/URL input tabs
        <Tabs value={mode} onValueChange={(v) => setMode(v as ImageInputMode)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" disabled={disabled}>
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" disabled={disabled}>
              Image URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div className="rounded-lg border-2 border-gray-300 border-dashed p-6 dark:border-gray-600">
              <div className="text-center">
                {isUploading ? (
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                ) : (
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <div className="mt-4">
                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="rounded-md bg-primary px-4 py-2 text-primary-foreground">
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Please wait while your image is being uploaded
                      </p>
                    </div>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                      >
                        Choose File
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={disabled}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) void handleFileSelect(file);
                        }}
                      />
                      <p className="mt-2 text-muted-foreground text-sm">Image (JPG, PNG, WebP)</p>
                    </>
                  )}
                </div>
                <p className="mt-2 text-gray-500 text-sm">
                  {isUploading
                    ? "Uploading your cover image..."
                    : "Upload a cover image for your event (max 4MB)"}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={disabled}
                  className="form-input-enhanced"
                />
                <p className="form-helper-text text-xs">Masukkan URL gambar cover event</p>
              </div>
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={disabled || !imageUrl.trim()}
              >
                Use This URL
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
