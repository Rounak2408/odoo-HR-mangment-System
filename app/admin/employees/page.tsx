"use client"

import type React from "react"
import { Suspense, useState, useMemo, useCallback, useEffect } from "react"
import { mockEmployees } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Plus, Search } from "lucide-react"
import Link from "next/link"

function EmployeesContent() {
  // Load employees from localStorage or use mock data
  // Priority: localStorage employees (edited) override mock employees
  const loadEmployees = () => {
    try {
      const stored = localStorage.getItem("dayflow_employees")
      if (stored) {
        const parsed = JSON.parse(stored)
        // Get IDs of employees in localStorage (these override mock data)
        const storedIds = new Set(parsed.map((e: any) => e.id))
        // Get mock employees that are NOT in localStorage (not yet edited)
        const mockOnly = mockEmployees.filter((e) => !storedIds.has(e.id))
        // Combine: localStorage employees (edited) + remaining mock employees
        return [...parsed, ...mockOnly]
      }
    } catch (error) {
      console.error("Error loading employees from localStorage:", error)
    }
    return mockEmployees
  }

  const [employees, setEmployees] = useState<any[]>(() => loadEmployees())

  // Refresh employees list when component mounts or when returning from edit page
  useEffect(() => {
    const refreshEmployees = () => {
      setEmployees(loadEmployees())
    }
    
    // Refresh on mount
    refreshEmployees()
    
    // Listen for storage changes (when employee is edited in another tab/window)
    window.addEventListener('storage', refreshEmployees)
    
    // Also refresh when page becomes visible (user returns from edit page)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        refreshEmployees()
      }
    })
    
    // Refresh when window gains focus (user navigates back)
    window.addEventListener('focus', refreshEmployees)
    
    return () => {
      window.removeEventListener('storage', refreshEmployees)
      window.removeEventListener('focus', refreshEmployees)
    }
  }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    email: "",
    department: "",
    position: "",
    phone: "",
  })

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Limit phone number to 10 digits only
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10)
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSaveEmployee = () => {
    // Validate required fields
    if (!formData.id || !formData.name || !formData.email || !formData.department || !formData.position) {
      alert("Please fill in all required fields (ID, Name, Email, Department, Position)")
      return
    }

    // Normalize email for comparison
    const normalizedEmail = formData.email.toLowerCase().trim()

    // Check if employee ID already exists
    if (employees.some((emp) => emp.id === formData.id)) {
      alert("Employee ID already exists. Please use a different ID.")
      return
    }

    // Check if email already exists (case-insensitive)
    if (employees.some((emp) => emp.email?.toLowerCase().trim() === normalizedEmail)) {
      alert("Email already exists. Please use a different email.")
      return
    }

    // Check if phone number already exists (if provided)
    if (formData.phone) {
      if (employees.some((emp) => emp.phone && emp.phone === formData.phone)) {
        alert("Phone number already exists. Please use a different phone number.")
        return
      }
    }

    // Create new employee object with all required fields
    const newEmployee = {
      id: formData.id,
      name: formData.name,
      email: formData.email,
      department: formData.department,
      position: formData.position,
      phone: formData.phone || "",
      joinDate: new Date().toISOString().split("T")[0], // Current date
      salary: 50000, // Default salary
      profileImage: "/diverse-avatars.png",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
    }

    // Add to employees list
    const updatedEmployees = [...employees, newEmployee]
    setEmployees(updatedEmployees)

    // Persist to localStorage
    try {
      const storedEmployees = localStorage.getItem("dayflow_employees")
      const employeesList = storedEmployees ? JSON.parse(storedEmployees) : []
      employeesList.push(newEmployee)
      localStorage.setItem("dayflow_employees", JSON.stringify(employeesList))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }

    // Reset form and close
    setFormData({
      id: "",
      name: "",
      email: "",
      department: "",
      position: "",
      phone: "",
    })
    setShowAddForm(false)
  }

  // Memoize filtered employees to avoid re-filtering on every render
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) {
      return employees
    }
    const lowerSearchTerm = searchTerm.toLowerCase()
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(lowerSearchTerm) ||
        emp.email.toLowerCase().includes(lowerSearchTerm) ||
        emp.id.toLowerCase().includes(lowerSearchTerm),
    )
  }, [employees, searchTerm])

  // Memoize delete handler to prevent unnecessary re-renders
  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this employee?")) {
        setEmployees((prev) => {
          const updated = prev.filter((emp) => emp.id !== id)
          // Persist to localStorage
          try {
            const storedEmployees = localStorage.getItem("dayflow_employees")
            if (storedEmployees) {
              const employeesList = JSON.parse(storedEmployees)
              const filtered = employeesList.filter((e: any) => e.id !== id)
              localStorage.setItem("dayflow_employees", JSON.stringify(filtered))
            }
          } catch (error) {
            console.error("Error updating localStorage:", error)
          }
          return updated
        })
      }
    },
    [],
  )

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground mt-2">Manage all employees in your organization</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or employee ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Employee Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Employee</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                name="id"
                placeholder="Employee ID" 
                value={formData.id}
                onChange={handleFormChange}
              />
              <Input 
                name="name"
                placeholder="Full Name" 
                value={formData.name}
                onChange={handleFormChange}
              />
              <Input 
                name="email"
                placeholder="Email" 
                type="email" 
                value={formData.email}
                onChange={handleFormChange}
              />
              <Input 
                name="department"
                placeholder="Department" 
                value={formData.department}
                onChange={handleFormChange}
              />
              <Input 
                name="position"
                placeholder="Position" 
                value={formData.position}
                onChange={handleFormChange}
              />
              <Input 
                name="phone"
                type="tel"
                placeholder="1234567890" 
                value={formData.phone}
                onChange={handleFormChange}
                maxLength={10}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveEmployee}>Save Employee</Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false)
                  setFormData({
                    id: "",
                    name: "",
                    email: "",
                    department: "",
                    position: "",
                    phone: "",
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>
            Total: {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 font-medium">Employee ID</th>
                  <th className="text-left py-3 font-medium">Name</th>
                  <th className="text-left py-3 font-medium">Department</th>
                  <th className="text-left py-3 font-medium">Position</th>
                  <th className="text-left py-3 font-medium">Email</th>
                  <th className="text-center py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-mono text-xs">{employee.id}</td>
                    <td className="py-3 font-medium">{employee.name}</td>
                    <td className="py-3">
                      <Badge variant="secondary">{employee.department}</Badge>
                    </td>
                    <td className="py-3">{employee.position}</td>
                    <td className="py-3 text-muted-foreground">{employee.email}</td>
                    <td className="py-3 flex justify-center gap-2">
                      <Link href={`/admin/employees/${employee.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(employee.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <EmployeesContent />
    </Suspense>
  )
}
