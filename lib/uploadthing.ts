import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  projectImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      console.log("[v0] UploadThing middleware called")
      return { userId: "user" }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[v0] Server-side upload complete for userId:", metadata.userId)
      console.log("[v0] Server-side file url:", file.url)
      console.log("[v0] Server-side file key:", file.key)
      console.log("[v0] Server-side file name:", file.name)
      return { uploadedBy: metadata.userId, url: file.url, key: file.key }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
