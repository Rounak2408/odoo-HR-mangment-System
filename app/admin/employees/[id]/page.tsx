"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { mockEmployees } from "@/lib/mock-data"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function EmployeeDetailPage() {
  const params = useParams()
  const [employee, setEmployee] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const loadEmployee = () => {
      let emp = null
      
      // First check localStorage (edited employees take priority over mock data)
      try {
        const storedEmployees = localStorage.getItem("dayflow_employees")
        if (storedEmployees) {
          const parsed = JSON.parse(storedEmployees)
          emp = parsed.find((e: any) => e.id === params.id)
        }
      } catch (error) {
        console.error("Error loading employees from localStorage:", error)
      }
      
      // If not found in localStorage, check mock employees
      if (!emp) {
        emp = mockEmployees.find((e) => e.id === params.id)
      }
      
      if (emp) {
        setEmployee(emp)
        setFormData(emp)
      }
    }
    
    loadEmployee()
  }, [params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Limit phone number to 10 digits only
    if (name === "phone" || name === "emergencyPhone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10)
      setFormData((prev: any) => ({ ...prev, [name]: digitsOnly }))
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }))
    }
  }

  const handleSave = () => {
    // Validate required fields
    if (!formData.id || !formData.name || !formData.email) {
      alert("Please fill in all required fields (ID, Name, Email)")
      return
    }

    // Validate for duplicates (excluding current employee)
    const allUsers = getAllExistingUsers()
    const normalizedEmail = formData.email?.toLowerCase().trim()
    
    // Check for duplicate Employee ID (excluding current employee)
    if (formData.id !== employee.id) {
      const duplicateId = allUsers.find((user) => user.id === formData.id)
      if (duplicateId) {
        alert("This Employee ID is already taken by another employee. Please use a different ID.")
        return
      }
    }
    
    // Check for duplicate email (excluding current employee)
    const duplicateEmail = allUsers.find(
      (user) => user.id !== employee.id && user.email?.toLowerCase().trim() === normalizedEmail
    )
    if (duplicateEmail) {
      alert("This email is already registered to another employee. Please use a different email.")
      return
    }

    // Check for duplicate phone number (if provided, excluding current employee)
    if (formData.phone) {
      const duplicatePhone = allUsers.find(
        (user) => user.id !== employee.id && user.phone && user.phone === formData.phone
      )
      if (duplicatePhone) {
        alert("This phone number is already registered to another employee. Please use a different phone number.")
        return
      }
    }

    // Check for duplicate emergency phone (if provided, excluding current employee)
    if (formData.emergencyPhone) {
      const duplicateEmergencyPhone = allUsers.find(
        (user) => user.id !== employee.id && user.emergencyPhone && user.emergencyPhone === formData.emergencyPhone
      )
      if (duplicateEmergencyPhone) {
        alert("This emergency phone number is already registered to another employee. Please use a different phone number.")
        return
      }
    }

    // Update employee state
    setEmployee(formData)
    setIsEditing(false)
    
    try {
      // Always save to localStorage - this will override mock data
      const storedEmployees = localStorage.getItem("dayflow_employees")
      let employeesList: any[] = []
      
      if (storedEmployees) {
        employeesList = JSON.parse(storedEmployees)
      }
      
      // Check if employee exists (by old ID or new ID)
      const employeeIndex = employeesList.findIndex((emp: any) => emp.id === employee.id || emp.id === formData.id)
      
      if (employeeIndex !== -1) {
        // Update existing employee
        employeesList[employeeIndex] = formData
      } else {
        // Employee not in localStorage (was from mock data) - add it
        employeesList.push(formData)
      }
      
      // Save updated list
      localStorage.setItem("dayflow_employees", JSON.stringify(employeesList))
      
      // Also update approved users if this employee is in that list
      const approvedUsers = localStorage.getItem("dayflow_approved_users")
      if (approvedUsers) {
        const approvedList = JSON.parse(approvedUsers)
        const approvedIndex = approvedList.findIndex((u: any) => 
          u.id === employee.id || u.employeeId === employee.id || 
          u.id === formData.id || u.employeeId === formData.id
        )
        if (approvedIndex !== -1) {
          approvedList[approvedIndex] = {
            ...approvedList[approvedIndex],
            ...formData,
            id: formData.id,
            employeeId: formData.id,
            email: formData.email,
            name: formData.name,
          }
          localStorage.setItem("dayflow_approved_users", JSON.stringify(approvedList))
        }
      }
      
      // Update user session if this is the logged-in user
      const currentUser = localStorage.getItem("dayflow_user")
      if (currentUser) {
        const user = JSON.parse(currentUser)
        if (user.id === employee.id || user.id === formData.id) {
          const updatedUser = {
            ...user,
            ...formData,
            id: formData.id,
          }
          localStorage.setItem("dayflow_user", JSON.stringify(updatedUser))
        }
      }
      
      // If ID changed, redirect to new URL
      if (formData.id !== employee.id) {
        alert("Employee information updated successfully! Redirecting...")
        window.location.href = `/admin/employees/${formData.id}`
        return
      }
      
      // Show success message and reload to reflect changes
      alert("Employee information updated successfully!")
      
      // Small delay to ensure localStorage is updated before reload
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } catch (error) {
      console.error("Error updating employee in localStorage:", error)
      alert("Error saving changes. Please try again.")
    }
  }

  if (!employee) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Edit Employee</h1>
          <p className="text-muted-foreground mt-2">{employee.name}</p>
        </div>
        <Button variant={isEditing ? "outline" : "default"} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Employee ID</label>
              {isEditing ? (
                <Input 
                  name="id" 
                  value={formData.id} 
                  onChange={handleInputChange} 
                  className="mt-1"
                  placeholder="EMP-001"
                />
              ) : (
                <Input disabled value={employee.id} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Full Name</label>
              {isEditing ? (
                <Input name="name" value={formData.name} onChange={handleInputChange} className="mt-1" />
              ) : (
                <Input disabled value={employee.name} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              {isEditing ? (
                <Input name="email" value={formData.email} onChange={handleInputChange} className="mt-1" />
              ) : (
                <Input disabled value={employee.email} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              {isEditing ? (
                <Input 
                  name="phone" 
                  type="tel"
                  placeholder="1234567890"
                  value={formData.phone} 
                  onChange={handleInputChange}
                  maxLength={10}
                  className="mt-1" 
                />
              ) : (
                <Input disabled value={employee.phone} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              {isEditing ? (
                <Input name="address" value={formData.address || ""} onChange={handleInputChange} className="mt-1" />
              ) : (
                <Input disabled value={employee.address || "-"} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Emergency Contact</label>
              {isEditing ? (
                <Input name="emergencyContact" value={formData.emergencyContact || ""} onChange={handleInputChange} className="mt-1" />
              ) : (
                <Input disabled value={employee.emergencyContact || "-"} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Emergency Phone</label>
              {isEditing ? (
                <Input 
                  name="emergencyPhone" 
                  type="tel"
                  placeholder="1234567890"
                  value={formData.emergencyPhone || ""} 
                  onChange={handleInputChange}
                  maxLength={10}
                  className="mt-1" 
                />
              ) : (
                <Input disabled value={employee.emergencyPhone || "-"} className="mt-1" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              {isEditing ? (
                <Input name="department" value={formData.department} onChange={handleInputChange} className="mt-1" />
              ) : (
                <Input disabled value={employee.department} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Position</label>
              {isEditing ? (
                <Input name="position" value={formData.position} onChange={handleInputChange} className="mt-1" />
              ) : (
                <Input disabled value={employee.position} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Join Date</label>
              {isEditing ? (
                <Input 
                  name="joinDate" 
                  type="date"
                  value={formData.joinDate} 
                  onChange={handleInputChange} 
                  className="mt-1"
                />
              ) : (
                <Input disabled value={employee.joinDate} className="mt-1" />
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Annual Salary</label>
              {isEditing ? (
                <Input
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              ) : (
                <Input disabled value={`₹${(employee.salary || 0).toLocaleString()}`} className="mt-1" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <div className="flex gap-4">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
