"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, CheckCircle, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"

interface FileUploadZoneProps {
  projectId: string
  onUploadComplete: () => void
}

type UploadState = "idle" | "uploading" | "success" | "error"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUploadZone({ projectId, onUploadComplete }: FileUploadZoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [dotCount, setDotCount] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const validateFile = (file: File): string | null => {
    if (!file.name.endsWith(".zip")) return "Only .zip files are accepted"
    if (file.size > 50 * 1024 * 1024) return "File exceeds 50MB limit"
    return null
  }

  const startDotAnimation = () => {
    dotTimerRef.current = setInterval(() => {
      setDotCount(d => (d >= 3 ? 1 : d + 1))
    }, 400)
  }

  const stopDotAnimation = () => {
    if (dotTimerRef.current) {
      clearInterval(dotTimerRef.current)
      dotTimerRef.current = null
    }
  }

  const handleFileSelect = (file: File) => {
    const err = validateFile(file)
    if (err) {
      toast.error(err)
      return
    }
    setSelectedFile(file)
    setUploadState("idle")
    setErrorMessage("")
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => setDragActive(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadState("uploading")
    startDotAnimation()

    try {
      const formData = new FormData()
      formData.append("zipfile", selectedFile)

      const res = await fetch(`/api/projects/${projectId}/files/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const data = await res.json()
      stopDotAnimation()

      if (data.success) {
        setUploadState("success")
        setSuccessCount(data.data?.filesCount ?? 0)
        toast.success(data.message)
        onUploadComplete()
      } else {
        setUploadState("error")
        setErrorMessage(data.message || "Upload failed")
        toast.error(data.message)
      }
    } catch (err: any) {
      stopDotAnimation()
      setUploadState("error")
      setErrorMessage(err.message)
      toast.error(err.message)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadState("idle")
    setErrorMessage("")
    if (inputRef.current) inputRef.current.value = ""
  }

  const dots = ".".repeat(dotCount)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Drop Zone */}
      {uploadState !== "success" && (
        <div
          onClick={() => uploadState === "idle" && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            border: `2px dashed ${dragActive ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "0.5rem",
            padding: "2rem 1.5rem",
            textAlign: "center" as const,
            cursor: uploadState === "idle" ? "pointer" : "not-allowed",
            backgroundColor: dragActive ? "rgba(30, 64, 175, 0.04)" : "var(--bg)",
            transition: "all 0.2s ease",
            display: "flex",
            flexDirection: "column" as const,
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {uploadState === "idle" && (
            <>
              <Upload size={28} style={{ color: "var(--text-muted)" }} />
              {selectedFile ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                    {selectedFile.name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {formatBytes(selectedFile.size)}
                  </span>
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                    Drag & drop your project ZIP file here
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    or click to browse
                  </p>
                  <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    .zip files only • Max 50MB
                  </p>
                </>
              )}
            </>
          )}

          {uploadState === "uploading" && (
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                border: "3px solid var(--border)",
                borderTopColor: "var(--primary)",
                animation: "spin 0.8s linear infinite",
              }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)" }}>
                Uploading{dots}
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {uploadState === "error" && (
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={28} style={{ color: "var(--danger, #dc2626)" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--danger, #dc2626)" }}>
                {errorMessage}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {uploadState === "success" && (
        <div style={{
          border: "1px solid rgba(21, 128, 61, 0.3)",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          backgroundColor: "rgba(21, 128, 61, 0.05)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}>
          <CheckCircle size={24} style={{ color: "var(--success, #15803d)", flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>
              Upload complete — {successCount} file{successCount !== 1 ? "s" : ""} extracted
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Project files are now visible below
            </p>
          </div>
          <button
            onClick={handleReset}
            style={{
              marginLeft: "auto", background: "transparent", border: "none",
              cursor: "pointer", color: "var(--text-muted)", display: "flex",
              padding: "0.25rem",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        style={{ display: "none" }}
        onChange={handleInputChange}
      />

      {/* Action Buttons */}
      {uploadState !== "success" && (
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {selectedFile && uploadState === "idle" && (
            <button
              onClick={handleReset}
              style={{
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text-muted)", padding: "0.5rem 1rem",
                borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Clear
            </button>
          )}

          {uploadState === "error" && (
            <button
              onClick={handleReset}
              style={{
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text-muted)", padding: "0.5rem 1rem",
                borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Try Again
            </button>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploadState === "uploading"}
            style={{
              backgroundColor: selectedFile && uploadState !== "uploading" ? "var(--primary)" : "var(--border)",
              color: selectedFile && uploadState !== "uploading" ? "white" : "var(--text-muted)",
              border: "none", padding: "0.5rem 1.25rem",
              borderRadius: "0.375rem", cursor: selectedFile ? "pointer" : "not-allowed",
              fontSize: "0.875rem", fontWeight: 600,
              transition: "all 0.2s",
            }}
          >
            {uploadState === "uploading" ? `Uploading${dots}` : "Upload Project Files"}
          </button>
        </div>
      )}
    </div>
  )
}
