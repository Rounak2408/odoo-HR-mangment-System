"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Quote, Building2, Users, TrendingUp, Shield, Briefcase, Building, Phone, Key } from "lucide-react"
import { mockEmployees } from "@/lib/mock-data"

// Helper function to get all existing users (from localStorage and mock data)
const getAllExistingUsers = () => {
  const allUsers: any[] = []
  
  // Add mock employees
  allUsers.push(...mockEmployees)
  
  // Add users from localStorage
  try {
    const storedEmployees = localStorage.getItem("dayflow_employees")
    if (storedEmployees) {
      const parsed = JSON.parse(storedEmployees)
      allUsers.push(...parsed)
    }
  } catch (error) {
    console.error("Error loading employees from localStorage:", error)
  }
  
  return allUsers
}

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

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    employeeId: "",
    email: "",
    password: "",
    role: "employee",
    // Employee-specific fields
    department: "",
    position: "",
    phone: "",
    // Admin-specific fields
    adminCode: "",
    organizationName: "",
    permissions: "standard",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [currentQuote, setCurrentQuote] = useState(0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Limit phone number to 10 digits only
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10)
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleRoleChange = (value: string) => {
    // Reset role-specific fields when role changes
    setFormData((prev) => ({
      ...prev,
      role: value,
      department: "",
      position: "",
      phone: "",
      adminCode: "",
      organizationName: "",
      permissions: "standard",
    }))
  }

  // Rotate quotes every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % hackathonQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Role-based validation
    setTimeout(() => {
      const isEmployee = formData.role === "employee"
      const isAdmin = formData.role === "admin"

      // Common required fields
      if (!formData.employeeId || !formData.email || !formData.password) {
        setError("Please fill in all required fields")
        setLoading(false)
        return
      }

      // Employee-specific validation
      if (isEmployee) {
        if (!formData.department || !formData.position) {
          setError("Please fill in department and position for employee accounts")
          setLoading(false)
          return
        }
      }

      // Admin-specific validation
      if (isAdmin) {
        if (!formData.adminCode || !formData.organizationName) {
          setError("Please fill in admin code and organization name for admin accounts")
          setLoading(false)
          return
        }
        // Admin password must be "admin@123"
        if (formData.password !== "admin@123") {
          setError("Admin password must be 'admin@123'. Please enter the correct password.")
          setLoading(false)
          return
        }
      }

      // Check for duplicate email
      const existingUsers = getAllExistingUsers()
      const normalizedEmail = formData.email.toLowerCase().trim()
      if (existingUsers.some((user) => user.email?.toLowerCase().trim() === normalizedEmail)) {
        setError("This email is already registered. Please use a different email address.")
        setLoading(false)
        return
      }

      // Check for duplicate phone number (if provided for employees)
      if (isEmployee && formData.phone) {
        if (existingUsers.some((user) => user.phone && user.phone === formData.phone)) {
          setError("This phone number is already registered. Please use a different phone number.")
          setLoading(false)
          return
        }
      }

      // Check for duplicate employee ID
      if (existingUsers.some((user) => user.id === formData.employeeId)) {
        setError("This Employee ID is already taken. Please use a different ID.")
        setLoading(false)
        return
      }

      // Create pending registration object
      const pendingRegistration = {
        employeeId: formData.employeeId,
        email: formData.email,
        name: formData.email.split("@")[0],
        password: formData.password, // Store password for later approval
        role: formData.role,
        ...(isEmployee && {
          department: formData.department,
          position: formData.position,
          phone: formData.phone,
        }),
        ...(isAdmin && {
          adminCode: formData.adminCode,
          organizationName: formData.organizationName,
          permissions: formData.permissions,
        }),
      }

      // Save as pending registration via API
      fetch("/api/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pendingRegistration),
      })
        .then(async (response) => {
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.error || "Failed to register")
          }
          // Show success message and redirect to sign in
          setError("")
          alert("Registration submitted successfully! Please wait for admin approval. You will be able to sign in once your account is approved.")
          router.push("/auth/signin")
          setLoading(false)
        })
        .catch((error) => {
          console.error("Error saving pending registration:", error)
          setError(error.message || "Failed to submit registration. Please try again.")
          setLoading(false)
        })
    }, 500)
  }

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

      {/* Right Side - Sign Up Form */}
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
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Join Odoo Hackathon '26 and manage your workforce</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employee ID</label>
                  <Input
                    name="employeeId"
                    placeholder="EMP-001"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">HR / Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee-specific fields */}
                {formData.role === "employee" && (
                  <>
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Employee Information
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Department <span className="text-destructive">*</span>
                      </label>
                      <Input
                        name="department"
                        placeholder="e.g., Engineering, Marketing, HR"
                        value={formData.department}
                        onChange={handleChange}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Position <span className="text-destructive">*</span>
                      </label>
                      <Input
                        name="position"
                        placeholder="e.g., Software Engineer, Marketing Manager"
                        value={formData.position}
                        onChange={handleChange}
                        className="h-11"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="phone"
                          type="tel"
                          placeholder="1234567890"
                          value={formData.phone}
                          onChange={handleChange}
                          maxLength={10}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Admin-specific fields */}
                {formData.role === "admin" && (
                  <>
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administrator Information
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Admin Code <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="adminCode"
                          placeholder="Enter your admin authorization code"
                          value={formData.adminCode}
                          onChange={handleChange}
                          className="h-11 pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Contact your system administrator for the authorization code
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Organization Name <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="organizationName"
                          placeholder="Your company or organization name"
                          value={formData.organizationName}
                          onChange={handleChange}
                          className="h-11 pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Access Level</label>
                      <Select
                        value={formData.permissions}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, permissions: value }))
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard Admin</SelectItem>
                          <SelectItem value="super">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Standard: Manage employees and attendance. Super: Full system access.
                      </p>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full h-11 mt-4" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
