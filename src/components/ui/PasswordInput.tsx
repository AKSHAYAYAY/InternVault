"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface PasswordInputProps {
  id?: string
  name: string
  placeholder?: string
  className?: string
  style?: React.CSSProperties
  required?: boolean
  minLength?: number
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  autoComplete?: string
}

export function PasswordInput({
  id,
  name,
  placeholder = "••••••••",
  className,
  style,
  required,
  minLength,
  value,
  onChange,
  autoComplete,
}: PasswordInputProps) {
  const [show, setShow] = useState(false)

  const isControlled = value !== undefined

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className={className}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        {...(isControlled ? { value, onChange } : {})}
        style={{
          ...style,
          paddingRight: "2.75rem",
          width: "100%",
        }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          color: "var(--text-muted)",
          lineHeight: 1,
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
