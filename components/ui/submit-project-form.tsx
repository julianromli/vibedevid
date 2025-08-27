"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitProject } from "@/lib/actions"
import { Loader2, Upload, X, CheckCircle } from "lucide-react"
import { UploadButton } from "@uploadthing/react"
import { AspectRatio } from "@/components/ui/aspect-ratio"

interface SubmitProjectFormProps {
  userId: string
}

const categories = [
  "Web Development",
  "Mobile App",
  "Desktop App",
  "AI/ML",
  "Game Development",
  "Design",
  "DevTools",
  "Open Source",
  "Other",
]

export function SubmitProjectForm({ userId }: SubmitProjectFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      if (uploadedImageUrl) {
        formData.set("image_url", uploadedImageUrl)
      }

      const result = await submitProject(formData, userId)
      if (result.success) {
        router.push(`/project/${result.projectId}`)
      } else {
        setError(result.error || "Failed to submit project")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Enter your project title"
              required
              disabled={isLoading || isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your project, its features, and what makes it special"
              rows={4}
              required
              disabled={isLoading || isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select name="category" required disabled={isLoading || isUploading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              placeholder="https://your-project.com"
              disabled={isLoading || isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label>Project Screenshot</Label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              {uploadedImageUrl ? (
                <div className="space-y-4">
                  <div className="relative">
                    <AspectRatio ratio={16/9}>
                      <img
                        src={uploadedImageUrl || "/placeholder.svg"}
                        alt="Project screenshot preview"
                        className="w-full h-full object-cover rounded-lg shadow-md"
                      />
                    </AspectRatio>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImageUrl("")
                        setError(null)
                      }}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Image uploaded successfully!</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  {isUploading ? (
                    <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="mt-4">
                    {isUploading ? (
                      <div className="space-y-2">
                        <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
                          <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                          Uploading...
                        </div>
                        <p className="text-sm text-muted-foreground">Please wait while your image is being uploaded</p>
                      </div>
                    ) : (
                      <UploadButton
                        endpoint="projectImageUploader"
                        onUploadBegin={(name) => {
                          console.log("[v0] Upload started for file:", name)
                          setIsUploading(true)
                          setError(null)
                          
                          // Clear existing timeout if any
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout)
                          }
                          
                          // Set a fallback timeout to prevent stuck state (30 seconds)
                          const timeoutId = setTimeout(() => {
                            console.log("[v0] Upload timeout - resetting state")
                            setIsUploading(false)
                            setError("Upload timed out. Please try again.")
                          }, 30000)
                          
                          setUploadTimeout(timeoutId)
                        }}
                        onClientUploadComplete={(res) => {
                          console.log("[v0] Client upload completed:", res)
                          console.log("[v0] Full response object:", JSON.stringify(res, null, 2))
                          
                          // Clear timeout since upload completed
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout)
                            setUploadTimeout(null)
                          }
                          
                          // Always set uploading to false first
                          setIsUploading(false)
                          
                          // Check if we have a valid response
                          if (res && Array.isArray(res) && res.length > 0) {
                            const uploadResult = res[0]
                            console.log("[v0] Upload result:", uploadResult)
                            
                            // Try to get URL from different possible locations
                            const imageUrl = uploadResult.url || uploadResult.fileUrl || uploadResult.key
                            
                            if (imageUrl) {
                              console.log("[v0] Setting image URL:", imageUrl)
                              setUploadedImageUrl(imageUrl)
                            } else {
                              console.error("[v0] No URL found in upload result:", uploadResult)
                              setError("Upload completed but no URL received. Please try again.")
                            }
                          } else {
                            console.error("[v0] Invalid response format:", res)
                            setError("Upload completed but response format is invalid. Please try again.")
                          }
                        }}
                        onUploadError={(error: Error) => {
                          console.error("[v0] Upload error:", error)
                          
                          // Clear timeout since upload failed
                          if (uploadTimeout) {
                            clearTimeout(uploadTimeout)
                            setUploadTimeout(null)
                          }
                          
                          setIsUploading(false)
                          setError(`Upload failed: ${error.message}`)
                        }}
                        onUploadProgress={(progress) => {
                          console.log("[v0] Upload progress:", progress)
                        }}
                        config={{
                          mode: "auto",
                        }}
                        content={{
                          button({ ready }) {
                            if (ready) return <div>Choose File</div>
                            return "Getting ready..."
                          },
                          allowedContent({ ready, fileTypes, isUploading }) {
                            if (!ready) return "Checking what you allow"
                            if (isUploading) return "Uploading..."
                            return `Image (${fileTypes.join(", ")})`
                          },
                        }}
                        appearance={{
                          button: "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md",
                          allowedContent: "text-sm text-muted-foreground mt-2",
                        }}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {isUploading ? "Uploading your screenshot..." : "Upload a screenshot of your project (max 4MB)"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Project"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
