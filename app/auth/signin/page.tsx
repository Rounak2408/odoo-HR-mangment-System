"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Quote, Building2, Users, TrendingUp } from "lucide-react"

// Odoo Hackathon Inspirational Quotes
const hackathonQuotes = [
  {
    quote: "Innovation distinguishes between a leader and a follower. Build something that matters, something that solves real problems.",
    author: "Steve Jobs",
    icon: Users,
  },
  {
    quote: "The best way to predict the future is to invent it. Your code today shapes tomorrow's possibilities.",
    author: "Alan Kay",
    icon: TrendingUp,
  },
  {
    quote: "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep building, keep iterating.",
    author: "Winston Churchill",
    icon: Building2,
  },
  {
    quote: "The only way to do great work is to love what you do. Passion drives innovation in every line of code.",
    author: "Steve Jobs",
    icon: Users,
  },
  {
    quote: "Code is like humor. When you have to explain it, it's bad. Build with clarity, build with purpose.",
    author: "Cory House",
    icon: TrendingUp,
  },
]

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(0)

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Mock authentication
    setTimeout(() => {
      if (!email || !password) {
        setError("Please enter email and password")
        setLoading(false)
        return
      }

      // Employee password mapping
      const employeePasswords: Record<string, { password: string; id: string; name: string }> = {
        "aditya@dayflow.com": { password: "aditya@123", id: "EMP-001", name: "Aditya" },
        "himanshu@dayflow.com": { password: "himanshu@123", id: "EMP-002", name: "Himanshu" },
        "sudhanshu@dayflow.com": { password: "sudhanshu@123", id: "EMP-003", name: "Sudhanshu" },
      }

      const normalizedEmail = email.toLowerCase().trim()
      const employeeData = employeePasswords[normalizedEmail]

      // Check if user is trying to login as admin
      const isAdminAttempt = email.includes("admin") || email.toLowerCase().includes("admin")
      
      if (isAdminAttempt) {
        // Admin password validation - must be "admin@123"
        if (password !== "admin@123") {
          setError("Invalid admin password. Please enter the correct password.")
          setLoading(false)
          return
        }
        
        // Valid admin credentials
        const user = {
          id: "1",
          email,
          name: email.split("@")[0],
          role: "admin",
          passwordVerified: true, // Flag to indicate password was verified
        }
        localStorage.setItem("dayflow_user", JSON.stringify(user))
        router.push("/admin/dashboard")
      } else if (employeeData) {
        // Specific employee login (Aditya, Himanshu, Sudhanshu) - validate password
        // These existing employees don't need approval - they can sign in directly
        if (password !== employeeData.password) {
          setError(`Invalid password for ${employeeData.name}. Please enter the correct password.`)
          setLoading(false)
          return
        }
        
        // Valid employee credentials - no approval needed for existing employees
        const user = {
          id: employeeData.id,
          email: normalizedEmail,
          name: employeeData.name,
          role: "employee",
          passwordVerified: true,
        }
        localStorage.setItem("dayflow_user", JSON.stringify(user))
        router.push("/employee/dashboard")
      } else {
        // Check if this is an approved user from pending registrations
        const approvedUsers = localStorage.getItem("dayflow_approved_users")
        if (approvedUsers) {
          const approvedList = JSON.parse(approvedUsers)
          const approvedUser = approvedList.find((u: any) => u.email?.toLowerCase() === normalizedEmail)
          
          if (approvedUser) {
            // Check password
            if (password !== approvedUser.password) {
              setError("Invalid password. Please enter the correct password.")
              setLoading(false)
              return
            }
            
            // Valid approved user
            const user = {
              id: approvedUser.employeeId || approvedUser.id,
              email: normalizedEmail,
              name: approvedUser.name,
              role: approvedUser.role,
              passwordVerified: true,
              ...(approvedUser.department && { department: approvedUser.department }),
              ...(approvedUser.position && { position: approvedUser.position }),
              ...(approvedUser.phone && { phone: approvedUser.phone }),
            }
            localStorage.setItem("dayflow_user", JSON.stringify(user))
            router.push(approvedUser.role === "admin" ? "/admin/dashboard" : "/employee/dashboard")
            setLoading(false)
            return
          }
        }
        
        // Check if user is in pending registrations
        const pendingRegistrations = localStorage.getItem("dayflow_pending_registrations")
        if (pendingRegistrations) {
          const pendingList = JSON.parse(pendingRegistrations)
          const pendingUser = pendingList.find((u: any) => u.email?.toLowerCase() === normalizedEmail)
          if (pendingUser) {
            setError("Your account is pending approval. Please wait for admin approval before signing in.")
            setLoading(false)
            return
          }
        }
        
        // If not found in approved or pending, show error
        setError("Account not found. Please register first or contact administrator.")
        setLoading(false)
      }
      setLoading(false)
    }, 500)
  }

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % hackathonQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const quote = hackathonQuotes[currentQuote]
  const IconComponent = quote.icon

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Odoo Hackathon Quotes */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-accent/20 via-accent/15 to-accent/10 items-center justify-center p-12 relative">
        <div className="max-w-lg w-full">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-accent-foreground text-sm font-medium mb-6 border border-accent/30">
              <Quote className="h-4 w-4" />
              <span>Odoo Hackathon</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 text-foreground">Inspirational Quotes</h2>
            <p className="text-muted-foreground">
              Fuel your creativity and innovation with words from the greatest minds
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-card/90 backdrop-blur-sm border-l-4 border-l-accent">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-accent/20 text-accent-foreground">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed text-foreground mb-4 italic">
                      "{quote.quote}"
                    </p>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-foreground">{quote.author}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Indicators */}
            <div className="flex items-center justify-center gap-2">
              {hackathonQuotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuote(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentQuote ? "w-8 bg-accent" : "w-2 bg-muted"
                  }`}
                  aria-label={`View quote ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-background p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <h1 className="text-2xl font-bold">Odoo Hackathon '26</h1>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
