"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { mockEmployees } from "@/lib/mock-data"
import { loadEmployeeData } from "@/lib/employee-data"
import jsPDF from "jspdf"

// Helper function to get all existing users
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Mail, Phone, MapPin, Calendar, Building, Briefcase, Camera, Upload, Download } from "lucide-react"

export default function EmployeeProfile() {
  const [employee, setEmployee] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>(null)
  const [profilePicture, setProfilePicture] = useState<string>("")

  const loadEmployee = () => {
    const userData = localStorage.getItem("dayflow_user")
    if (userData) {
      const parsed = JSON.parse(userData)
      
      // Load from localStorage employees (where admin updates are stored) or mock data
      const employeeData = loadEmployeeData(parsed.id, parsed.email)
      
      // Merge user session data with employee data (employee data from admin takes priority)
      const emp = {
        id: parsed.id,
        name: employeeData?.name || parsed.name || "Employee",
        email: parsed.email,
        department: employeeData?.department || parsed.department || "",
        position: employeeData?.position || parsed.position || "",
        phone: employeeData?.phone || parsed.phone || "",
        address: employeeData?.address || parsed.address || "",
        salary: employeeData?.salary || parsed.salary || 0,
        joinDate: employeeData?.joinDate || parsed.joinDate || "",
        emergencyContact: employeeData?.emergencyContact || parsed.emergencyContact || "",
        emergencyPhone: employeeData?.emergencyPhone || parsed.emergencyPhone || "",
        profilePicture: parsed.profilePicture || employeeData?.profilePicture || "",
        ...employeeData, // Admin updates take priority
      }
      setEmployee(emp)
      setFormData(emp)
      setProfilePicture(emp.profilePicture || "")
      
      // Update user session with latest employee data
      const updatedUser = {
        ...parsed,
        ...emp,
      }
      localStorage.setItem("dayflow_user", JSON.stringify(updatedUser))
    }
  }

  useEffect(() => {
    loadEmployee()
    
    // Auto-refresh every 3 seconds to catch admin updates
    const interval = setInterval(() => {
      loadEmployee()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    // Only allow editing phone and address (basic details)
    if (name === "phone") {
      // Limit phone number to 10 digits only
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10)
      setFormData((prev: any) => {
        if (!prev) return { phone: digitsOnly }
        return { ...prev, [name]: digitsOnly }
      })
    } else if (name === "address") {
      setFormData((prev: any) => {
        if (!prev) return { address: value }
        return { ...prev, [name]: value }
      })
    }
    // Ignore other fields - they are read-only
  }

  const handleSave = () => {
    if (!formData || !employee) {
      alert("Unable to save. Please refresh the page and try again.")
      return
    }

    // Validate for duplicates (excluding current employee)
    const allUsers = getAllExistingUsers()
    
    // Check for duplicate phone number (if provided, excluding current employee)
    const phoneToCheck = formData.phone || ""
    if (phoneToCheck) {
      const duplicatePhone = allUsers.find(
        (user) => user.id !== employee.id && user.phone && user.phone === phoneToCheck
      )
      if (duplicatePhone) {
        alert("This phone number is already registered to another employee. Please use a different phone number.")
        return
      }
    }

    // Only update editable fields: phone, address, and profile picture
    const updatedPhone = formData.phone || employee.phone || ""
    const updatedAddress = formData.address || employee.address || ""
    const updatedProfilePicture = profilePicture || employee.profilePicture || ""
    
    const updatedEmployee = {
      ...employee, // Keep all existing data
      phone: updatedPhone,
      address: updatedAddress,
      profilePicture: updatedProfilePicture,
    }
    setEmployee(updatedEmployee)
    setIsEditing(false)
    
    // Update user data in localStorage (only editable fields)
    try {
      // Update dayflow_user (session data)
      const userData = localStorage.getItem("dayflow_user")
      if (userData) {
        const parsed = JSON.parse(userData)
        const updatedUser = {
          ...parsed,
          phone: updatedPhone,
          address: updatedAddress,
          profilePicture: updatedProfilePicture,
        }
        localStorage.setItem("dayflow_user", JSON.stringify(updatedUser))
      }

      // Also update dayflow_employees if the employee exists there
      const employeesData = localStorage.getItem("dayflow_employees")
      if (employeesData) {
        const employees = JSON.parse(employeesData)
        const employeeIndex = employees.findIndex((e: any) => e.id === employee.id || e.email === employee.email)
        if (employeeIndex !== -1) {
          employees[employeeIndex] = {
            ...employees[employeeIndex],
            phone: updatedPhone,
            address: updatedAddress,
            profilePicture: updatedProfilePicture,
          }
          localStorage.setItem("dayflow_employees", JSON.stringify(employees))
        }
      }

      // Show success message
      alert("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating user data in localStorage:", error)
      alert("An error occurred while saving. Please try again.")
    }
  }

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB")
        return
      }

      // Create a preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setProfilePicture(result)
        setFormData((prev: any) => ({ ...prev, profilePicture: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Helper function to get valid profile picture URL (not empty string)
  const getProfilePictureUrl = () => {
    const pic = profilePicture || employee?.profilePicture
    return pic && pic.trim() !== "" ? pic : undefined
  }

  // Function to download documents as PDF with professional styling
  const downloadDocument = (documentType: string) => {
    if (!employee) return

    const doc = new jsPDF()
    let filename = ""
    let yPosition = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Helper function to add colored box/header
    const addHeaderBox = (text: string, fontSize: number = 16, color: [number, number, number] = [33, 150, 243]) => {
      doc.setFillColor(...color)
      doc.roundedRect(margin, yPosition - 5, contentWidth, 12, 2, 2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", "bold")
      doc.text(text, pageWidth / 2, yPosition + 3, { align: "center" })
      doc.setTextColor(0, 0, 0)
      yPosition += 15
    }

    // Helper function to add section box
    const addSectionBox = (title: string, startY: number) => {
      const boxHeight = yPosition - startY + 5
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, startY - 8, contentWidth, boxHeight, 2, 2, 'S')
      doc.setFillColor(245, 245, 245)
      doc.roundedRect(margin, startY - 8, contentWidth, 8, 2, 2, 'FD')
      doc.setTextColor(51, 51, 51)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(title, margin + 5, startY - 2)
      doc.setTextColor(0, 0, 0)
    }

    // Helper function to add text with line breaks and page breaks
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, align: "left" | "center" | "right" = "left", color: [number, number, number] | null = null) => {
      if (color) doc.setTextColor(color[0], color[1], color[2])
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", isBold ? "bold" : "normal")
      const lines = doc.splitTextToSize(text, contentWidth - 10)
      
      // Check if we need a new page
      const lineHeight = fontSize * 0.4
      const neededHeight = lines.length * lineHeight + 5
      if (yPosition + neededHeight > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }
      
      const xPos = align === "center" ? pageWidth / 2 : align === "right" ? pageWidth - margin - 5 : margin + 5
      doc.text(lines, xPos, yPosition, { align })
      yPosition += lines.length * lineHeight + 5
      if (color) doc.setTextColor(0, 0, 0)
    }

    // Helper function to add horizontal line
    const addLine = () => {
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
    }

    // Helper function to add key-value pair in a styled box
    const addKeyValue = (key: string, value: string, highlight: boolean = false) => {
      const startY = yPosition
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(key, margin + 5, yPosition)
      yPosition += 5
      doc.setFontSize(11)
      doc.setFont("helvetica", highlight ? "bold" : "normal")
      if (highlight) {
        doc.setTextColor(33, 150, 243)
      } else {
        doc.setTextColor(0, 0, 0)
      }
      doc.text(value, margin + 5, yPosition)
      yPosition += 8
      doc.setTextColor(0, 0, 0)
    }

    switch (documentType) {
      case "employment-agreement":
        filename = `Employment_Agreement_${employee.name.replace(/\s+/g, "_")}_${employee.id}.pdf`
        
        // Professional Header with colored box
        addHeaderBox("EMPLOYMENT AGREEMENT", 16, [33, 150, 243])
        yPosition += 5
        
        // Employee Information Section with styled box
        const empInfoStart = yPosition
        addKeyValue("Name", employee.name, true)
        addKeyValue("Employee ID", employee.id)
        addKeyValue("Email", employee.email)
        addKeyValue("Department", employee.department)
        addKeyValue("Position", employee.position)
        addKeyValue("Join Date", employee.joinDate)
        addSectionBox("Employee Information", empInfoStart)
        yPosition += 5
        
        // Terms and Conditions Section
        const termsStart = yPosition
        addText("Terms and Conditions", 12, true)
        yPosition += 3
        addText(`This employment agreement is between ${employee.name} and the organization. The employee agrees to abide by all company policies and procedures.`, 10)
        addSectionBox("Terms and Conditions", termsStart)
        yPosition += 5
        
        // Salary Information with highlighted box
        const salaryStart = yPosition
        addKeyValue("Annual Salary", `₹${(employee.salary || 0).toLocaleString()}`, true)
        addKeyValue("Monthly Salary", `₹${((employee.salary || 0) / 12).toLocaleString("en-US", { maximumFractionDigits: 0 })}`, true)
        doc.setFillColor(240, 248, 255)
        doc.roundedRect(margin, salaryStart - 8, contentWidth, yPosition - salaryStart + 3, 2, 2, 'FD')
        doc.setDrawColor(33, 150, 243)
        doc.setLineWidth(1)
        doc.roundedRect(margin, salaryStart - 8, contentWidth, yPosition - salaryStart + 3, 2, 2, 'S')
        addText("Salary Information", 12, true)
        doc.text("Salary Information", margin + 5, salaryStart - 2)
        yPosition += 5
        
        // Footer with line
        yPosition = pageHeight - 30
        addLine()
        addText("Odoo Hackathon '26 - HRMS", 9, false, "center", [100, 100, 100])
        addText(`Generated: ${new Date().toLocaleString()}`, 8, false, "center", [150, 150, 150])
        break

      case "payslip":
        const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" })
        const monthlySalary = (employee.salary || 0) / 12
        const bonus = 2000
        const deductions = 1500
        const netSalary = monthlySalary + bonus - deductions
        
        filename = `Payslip_${employee.name.replace(/\s+/g, "_")}_${currentMonth.replace(/\s+/g, "_")}.pdf`
        
        // Professional Header
        addHeaderBox(`PAYSLIP - ${currentMonth.toUpperCase()}`, 16, [76, 175, 80])
        yPosition += 5
        
        // Employee Information Section
        const payEmpStart = yPosition
        addKeyValue("Name", employee.name, true)
        addKeyValue("Employee ID", employee.id)
        addKeyValue("Department", employee.department)
        addKeyValue("Position", employee.position)
        addSectionBox("Employee Information", payEmpStart)
        yPosition += 5
        
        // Salary Details with styled table
        const salaryDetailsStart = yPosition
        doc.setFillColor(250, 250, 250)
        doc.roundedRect(margin, yPosition - 5, contentWidth, 50, 2, 2, 'FD')
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin, yPosition - 5, contentWidth, 50, 2, 2, 'S')
        
        addText("Salary Details", 12, true)
        yPosition += 8
        
        // Base Salary
        doc.text("Base Salary:", margin + 10, yPosition)
        doc.text(`₹${monthlySalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, pageWidth - margin - 10, yPosition, { align: "right" })
        yPosition += 8
        
        // Bonus (green)
        doc.setTextColor(76, 175, 80)
        doc.setFont("helvetica", "bold")
        doc.text("Bonus:", margin + 10, yPosition)
        doc.text(`+₹${bonus.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, pageWidth - margin - 10, yPosition, { align: "right" })
        yPosition += 8
        doc.setTextColor(0, 0, 0)
        
        // Deductions (red)
        doc.setTextColor(244, 67, 54)
        doc.setFont("helvetica", "bold")
        doc.text("Deductions:", margin + 10, yPosition)
        doc.text(`-₹${deductions.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, pageWidth - margin - 10, yPosition, { align: "right" })
        yPosition += 8
        doc.setTextColor(0, 0, 0)
        
        // Separator line
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(1)
        doc.line(margin + 10, yPosition, pageWidth - margin - 10, yPosition)
        yPosition += 8
        
        // Net Salary (highlighted)
        doc.setFillColor(240, 248, 255)
        doc.roundedRect(margin + 5, yPosition - 3, contentWidth - 10, 10, 1, 1, 'FD')
        doc.setTextColor(33, 150, 243)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(14)
        doc.text("Net Salary:", margin + 10, yPosition + 3)
        doc.text(`₹${netSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, pageWidth - margin - 10, yPosition + 3, { align: "right" })
        doc.setTextColor(0, 0, 0)
        yPosition += 15
        
        // Payment Date
        addKeyValue("Payment Date", new Date().toLocaleDateString())
        yPosition += 5
        
        // Footer
        yPosition = pageHeight - 30
        addLine()
        addText("Odoo Hackathon '26 - HRMS", 9, false, "center", [100, 100, 100])
        addText(`Generated: ${new Date().toLocaleString()}`, 8, false, "center", [150, 150, 150])
        break

      case "tax-documents":
        filename = `Tax_Documents_${employee.name.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`
        
        // Professional Header
        addHeaderBox(`TAX DOCUMENTS - ${new Date().getFullYear()}`, 16, [156, 39, 176])
        yPosition += 5
        
        // Employee Information Section
        const taxEmpStart = yPosition
        addKeyValue("Name", employee.name, true)
        addKeyValue("Employee ID", employee.id)
        addKeyValue("Email", employee.email)
        addKeyValue("PAN", "[To be updated]")
        addSectionBox("Employee Information", taxEmpStart)
        yPosition += 5
        
        // Financial Year (highlighted)
        doc.setFillColor(243, 229, 245)
        doc.roundedRect(margin, yPosition - 5, contentWidth, 12, 2, 2, 'FD')
        doc.setDrawColor(156, 39, 176)
        doc.setLineWidth(1)
        doc.roundedRect(margin, yPosition - 5, contentWidth, 12, 2, 2, 'S')
        doc.setTextColor(156, 39, 176)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(12)
        doc.text(`Financial Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, pageWidth / 2, yPosition + 3, { align: "center" })
        doc.setTextColor(0, 0, 0)
        yPosition += 15
        
        // Annual Income Details
        const incomeStart = yPosition
        addKeyValue("Gross Annual Salary", `₹${(employee.salary || 0).toLocaleString()}`, true)
        addKeyValue("Taxable Income", `₹${(employee.salary || 0).toLocaleString()}`, true)
        addSectionBox("Annual Income Details", incomeStart)
        yPosition += 5
        
        // Tax Deductions
        const taxStart = yPosition
        addKeyValue("TDS Deducted", "[To be calculated]")
        addKeyValue("Tax Slab", "[To be determined]")
        addSectionBox("Tax Deductions", taxStart)
        yPosition += 5
        
        // Investment Declarations
        const investStart = yPosition
        addKeyValue("Section 80C", "[To be declared]")
        addKeyValue("Section 80D", "[To be declared]")
        addKeyValue("Other Deductions", "[To be declared]")
        addSectionBox("Investment Declarations", investStart)
        yPosition += 5
        
        // Note with warning style
        doc.setFillColor(255, 243, 224)
        doc.roundedRect(margin, yPosition, contentWidth, 15, 2, 2, 'FD')
        doc.setDrawColor(255, 152, 0)
        doc.setLineWidth(0.5)
        doc.roundedRect(margin, yPosition, contentWidth, 15, 2, 2, 'S')
        doc.setTextColor(191, 87, 0)
        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        const noteText = "Note: This is a preliminary document. Please consult with HR for final tax calculations."
        const noteLines = doc.splitTextToSize(noteText, contentWidth - 10)
        doc.text(noteLines, pageWidth / 2, yPosition + 8, { align: "center" })
        doc.setTextColor(0, 0, 0)
        yPosition += 20
        
        // Footer
        yPosition = pageHeight - 30
        addLine()
        addText("Odoo Hackathon '26 - HRMS", 9, false, "center", [100, 100, 100])
        addText(`Generated: ${new Date().toLocaleString()}`, 8, false, "center", [150, 150, 150])
        break

      default:
        return
    }

    // Save the PDF
    doc.save(filename)
  }

  if (!employee) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-2">View your profile information. You can edit your phone, address, and profile picture.</p>
        </div>
        <Button 
          variant={isEditing ? "outline" : "default"} 
          onClick={() => {
            if (!isEditing) {
              // When entering edit mode, ensure formData is initialized
              if (!formData && employee) {
                setFormData({
                  phone: employee.phone || "",
                  address: employee.address || "",
                })
              }
            }
            setIsEditing(!isEditing)
          }}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Profile Header with Picture */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                {getProfilePictureUrl() ? (
                  <AvatarImage src={getProfilePictureUrl()} alt={employee.name} />
                ) : null}
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    aria-label="Upload profile picture"
                  />
                </label>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <CardTitle className="text-2xl">{employee.name}</CardTitle>
              <Badge className="w-fit">{employee.position}</Badge>
              <p className="text-muted-foreground">{employee.department}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Picture Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Picture</CardTitle>
          <CardDescription>Upload and manage your profile picture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-2 border-border">
              {getProfilePictureUrl() ? (
                <AvatarImage src={getProfilePictureUrl()} alt={employee.name} />
              ) : null}
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                {getProfilePictureUrl()
                  ? "Your profile picture is set"
                  : "No profile picture uploaded"}
              </p>
              {isEditing && (
                <label className="inline-flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {getProfilePictureUrl() ? "Change Picture" : "Upload Picture"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    aria-label="Upload or change profile picture"
                  />
                </label>
              )}
              {!isEditing && getProfilePictureUrl() && (
                <p className="text-xs text-muted-foreground">
                  Click "Edit Profile" to change your picture
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Details</CardTitle>
            <CardDescription>You can edit your phone and address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-muted-foreground">{employee.email}</p>
                <span className="text-xs text-muted-foreground italic">(Read-only)</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input 
                    name="phone" 
                    type="tel"
                    placeholder="1234567890"
                    value={formData?.phone || ""} 
                    onChange={handleInputChange}
                    maxLength={10}
                    className="flex-1"
                  />
                ) : (
                  <p className="flex-1">{employee.phone || "Not provided"}</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <div className="flex items-start gap-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground mt-2" />
                {isEditing ? (
                  <Textarea 
                    name="address" 
                    value={formData?.address || ""} 
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    className="flex-1 min-h-20"
                    rows={3}
                  />
                ) : (
                  <p className="flex-1">{employee.address || "Not provided"}</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
              <p className="mt-1">{employee.emergencyContact}</p>
              <p className="text-sm text-muted-foreground">{employee.emergencyPhone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
            <CardDescription>Job information (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
              <div className="flex items-center gap-2 mt-1">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <p className="font-mono">{employee.id}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Department</label>
              <div className="flex items-center gap-2 mt-1">
                <Building className="h-4 w-4 text-muted-foreground" />
                <p>{employee.department}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Position</label>
              <p className="mt-1">{employee.position}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Join Date</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p>{employee.joinDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Salary Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salary Structure</CardTitle>
          <CardDescription>Annual salary information (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Annual Salary</p>
              <p className="text-xl font-bold mt-2">₹{(employee.salary || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Monthly Salary</p>
              <p className="text-xl font-bold mt-2">
                ₹{((employee.salary || 0) / 12).toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Bonus</p>
              <p className="text-xl font-bold mt-2">2000 / month</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Deductions</p>
              <p className="text-xl font-bold mt-2">1500 / month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
          <CardDescription>Important employment documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Employment Agreement</p>
                  <p className="text-xs text-muted-foreground">Your employment contract and terms</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadDocument("employment-agreement")}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Briefcase className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Latest Payslip</p>
                  <p className="text-xs text-muted-foreground">Current month salary statement</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadDocument("payslip")}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Tax Documents</p>
                  <p className="text-xs text-muted-foreground">Tax information and declarations</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadDocument("tax-documents")}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center justify-between">
              <div>
                <p className="text-sm font-medium">You are editing your profile</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You can edit your phone number, address, and profile picture. Click Save Changes to apply your updates.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSave} className="min-w-32">
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false)
                    // Reset formData to current employee data
                    if (employee) {
                      setFormData({
                        phone: employee.phone || "",
                        address: employee.address || "",
                      })
                      setProfilePicture(employee.profilePicture || "")
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
