"use client"

import { UploadDropzone } from "@/services/uploadthing/components/UploadThing"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function DropzoneClient() {
  const router = useRouter()

  return (
    <UploadDropzone
      endpoint="resumeUploader"
      onClientUploadComplete={(res) => {
        console.log("Client upload completed:", res)
        toast.success("Tải lên CV thành công!")
        router.refresh()
      }}
      onUploadError={(error: Error) => {
        console.error("Client upload error:", error)
        toast.error(`Lỗi tải lên: ${error.message}`)
      }}
    />
  )
}

