import type { EditorInstance } from "novel";

/** Insert an uploaded image at the cursor. False when the editor is gone. */
export function insertUploadedImage(editor: EditorInstance | null, url: string): boolean {
  if (!editor) return false;
  editor
    .chain()
    .focus()
    .insertContent({ type: "image", attrs: { src: url } })
    .run();
  return true;
}
