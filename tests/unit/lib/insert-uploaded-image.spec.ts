import { describe, expect, it, vi } from "vite-plus/test";
import { insertUploadedImage } from "@/components/blog/insert-uploaded-image";

function fakeEditor() {
  const run = vi.fn(() => true);
  const insertContent = vi.fn(() => ({ run }));
  const focus = vi.fn(() => ({ insertContent }));
  const chain = vi.fn(() => ({ focus }));
  return { editor: { chain }, insertContent, run };
}

describe("insertUploadedImage", () => {
  it("inserts the image and reports success when the editor exists", () => {
    const { editor, insertContent, run } = fakeEditor();
    expect(insertUploadedImage(editor as never, "https://cdn.vibedeveloper.id/blog/u/a.png")).toBe(
      true,
    );
    expect(insertContent).toHaveBeenCalledWith({
      type: "image",
      attrs: { src: "https://cdn.vibedeveloper.id/blog/u/a.png" },
    });
    expect(run).toHaveBeenCalled();
  });

  it("reports failure when the editor is gone", () => {
    expect(insertUploadedImage(null, "https://cdn.vibedeveloper.id/blog/u/a.png")).toBe(false);
  });
});
