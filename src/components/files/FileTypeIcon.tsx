import { FileText, Archive, Image, Video, Code, File } from "lucide-react"

interface FileTypeIconProps {
  filename: string
  size?: number
  className?: string
}

export function FileTypeIcon({ filename, size = 16, className }: FileTypeIconProps) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""

  const iconProps = { size, className }

  if (ext === "pdf") return <FileText {...iconProps} />
  if (ext === "zip" || ext === "rar" || ext === "tar" || ext === "gz") return <Archive {...iconProps} />
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return <Image {...iconProps} />
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return <Video {...iconProps} />
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "go", "rs", "html", "css", "json", "md"].includes(ext)) return <Code {...iconProps} />
  return <File {...iconProps} />
}
