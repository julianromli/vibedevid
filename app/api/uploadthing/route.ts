import { createRouteHandler } from "uploadthing/next"
import { ourFileRouter } from "@/lib/uploadthing"

const uploadthingToken = process.env.UPLOADTHING_TOKEN?.trim()

console.log("[v0] UPLOADTHING_TOKEN exists:", !!uploadthingToken)
console.log("[v0] UPLOADTHING_TOKEN length:", uploadthingToken?.length || 0)
console.log("[v0] UPLOADTHING_TOKEN first 20 chars:", uploadthingToken?.substring(0, 20) || "undefined")

if (!uploadthingToken) {
  console.error("[v0] UPLOADTHING_TOKEN is missing or empty!")
  throw new Error("UPLOADTHING_TOKEN environment variable is required")
}

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: uploadthingToken,
  },
})
