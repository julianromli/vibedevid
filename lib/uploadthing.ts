import { createUploadthing, type FileRouter } from "uploadthing/next"
import { createClient } from "@/lib/supabase/server"

const f = createUploadthing()

export const ourFileRouter = {
  projectImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      console.log("[v0] UploadThing middleware called")
      
      try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.log("[v0] No authenticated user found")
          throw new Error("You must be logged in to upload files")
        }
        
        console.log("[v0] Authenticated user:", user.id)
        return { userId: user.id }
      } catch (error) {
        console.error("[v0] UploadThing middleware error:", error)
        throw error
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[v0] Server-side upload complete for userId:", metadata.userId)
      console.log("[v0] Server-side file url:", file.url)
      console.log("[v0] Server-side file key:", file.key)
      console.log("[v0] Server-side file name:", file.name)
      
      // Return the data that will be passed to onClientUploadComplete
      return { 
        uploadedBy: metadata.userId, 
        url: file.url, 
        key: file.key,
        name: file.name
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
