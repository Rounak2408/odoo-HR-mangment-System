"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Immediate redirect - no blocking
    if (typeof window === "undefined") return
    
    const isLoggedIn = localStorage.getItem("dayflow_user")
    if (isLoggedIn) {
      try {
        const user = JSON.parse(isLoggedIn)
        router.replace(user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard")
      } catch {
        router.replace("/auth/signin")
      }
    } else {
      router.replace("/auth/signin")
    }
  }, [router])

  // Minimal render - redirect happens immediately
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">Redirecting...</div>
    </div>
  )
}
