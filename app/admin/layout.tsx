"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Navbar } from "@/components/navbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // Check auth on client side only - run immediately
    if (typeof window === "undefined") {
      setChecked(true)
      return
    }

    try {
      const userData = localStorage.getItem("dayflow_user")
      if (!userData) {
        router.replace("/auth/signin")
        setChecked(true)
        return
      }

      const parsedUser = JSON.parse(userData)
      
      // Verify admin role and password authentication
      if (parsedUser.role !== "admin") {
        router.replace("/employee/dashboard")
        setChecked(true)
        return
      }

      // Additional security: Verify password was authenticated
      // This ensures only users who logged in with correct password can access
      if (!parsedUser.passwordVerified) {
        // Password not verified - redirect to sign in
        localStorage.removeItem("dayflow_user")
        router.replace("/auth/signin")
        setChecked(true)
        return
      }

      setUser(parsedUser)
      setChecked(true)
    } catch (error) {
      console.error("Auth error:", error)
      router.replace("/auth/signin")
      setChecked(true)
    }
  }, [router])

  // Show loading only briefly while checking
  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // If no user after check, we're redirecting
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} />
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
