"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { authenticate } from "./actions"
import styles from "./login.module.css"
import { PasswordInput } from "@/components/ui/PasswordInput"

export default function LoginPage() {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined)

  return (
    <main className={styles.container}>
      <div className={styles.formContainer}>
        
        <div className={styles.formHeader}>
          <h1 className={styles.title}>Intern Portal</h1>
          <p className={styles.subtitle}>Municipal Corporation</p>
        </div>
        
        <form action={dispatch} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email Address</label>
            <input 
              className={styles.input}
              id="email"
              type="email" 
              name="email" 
              placeholder="name@internvault.com" 
              required 
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              name="password"
              placeholder="••••••••"
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.errorContainer} aria-live="polite" aria-atomic="true">
            {errorMessage && (
              <p className={styles.errorMessage}>{errorMessage}</p>
            )}
          </div>

          <LoginButton />
        </form>

      </div>
    </main>
  )
}

function LoginButton() {
  const { pending } = useFormStatus()
 
  return (
    <button className={styles.button} aria-disabled={pending}>
      {pending ? "Authenticating..." : "Sign In"}
    </button>
  )
}
