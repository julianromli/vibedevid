# 016 — Label cover image file input

- **Status**: DONE
- **Commit**: c829824
- **Severity**: LOW
- **Category**: Accessibility
- **Rule**: react-doctor/control-has-associated-label
- **Estimated scope**: 1 file, small

## Problem

`components/blog/cover-image-uploader.tsx:125` is a visually hidden `input type="file"` over the drop zone. Nearby “Drag & drop an image” text is not associated with `htmlFor`, a wrapping `<label>`, or `aria-label`. Used on `/blog/editor` and `/blog/editor/$slug`.

    // components/blog/cover-image-uploader.tsx:112 — current
    <div className="space-y-1">
      <p className="text-lg font-medium">Drag & drop an image</p>
      <p className="text-muted-foreground text-sm">or click to browse from your device</p>
    </div>
    ...
    <input
      type="file"
      accept="image/*"
      className="absolute inset-0 cursor-pointer opacity-0"
      disabled={isUploading}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
      }}
    />

Canonical recipe: give the control a persistent accessible name. Prefer a wrapping `<label>` or `aria-label` for a visually hidden file input.

## Target

Wrap the drop zone in a `<label>` and point `htmlFor` at a stable input id, or set `aria-label` on the input.

    // target — smallest change
    <input
      id="blog-cover-image"
      type="file"
      accept="image/*"
      aria-label="Upload cover image"
      className="absolute inset-0 cursor-pointer opacity-0"
      disabled={isUploading}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
      }}
    />

If you wrap with `<label htmlFor="blog-cover-image">`, do not nest interactive elements. The current drop zone is a `div` plus the input; a single `<label className="relative ...">` around the existing markup is valid.

Keep accept, max-size copy, and `onFileSelect`.

## Repo conventions to follow

- Imitate `components/testimonial/testimonial-form.tsx:151` (`<Label htmlFor={fileInputId}>{t("avatar")}</Label>`).
- Imitate `components/event/event-filter-controls.tsx:91` if you use `aria-label` only.
- Do not restyle the drop zone.

## Steps

1. At `components/blog/cover-image-uploader.tsx:125`, add `id` + `aria-label="Upload cover image"` (or a wrapping label).
2. Do not change upload, crop, or clear handlers.
3. Do not edit `components/blog/editor-image-uploader.tsx` (unused leftover).

## Boundaries

- Do NOT add dependencies.
- Do NOT change the 4 MB copy or accepted types.
- STOP if the empty-state input has drifted from commit `c829824`.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `control-has-associated-label` at this input. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open `/blog/editor`. Confirm the drop zone still opens a file picker. Confirm the a11y tree names the control “Upload cover image” (or the visible “Drag & drop an image” if you used a wrapping label). Confirm click and keyboard activation still work.
- **Done when**: the diagnostic is gone and upload still works.
