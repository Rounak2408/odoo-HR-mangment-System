"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { mockLeaveRequests, mockEmployees } from "@/lib/mock-data"
import { loadEmployeeData } from "@/lib/employee-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "lucide-react"

export default function LeavePage() {
  const [employee, setEmployee] = useState<any>(null)
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [formData, setFormData] = useState({
    type: "paid",
    startDate: "",
    endDate: "",
    reason: "",
  })

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
        ...employeeData, // Admin updates take priority
      }
      setEmployee(emp)
      
      // Update user session with latest employee data
      const updatedUser = {
        ...parsed,
        ...emp,
      }
      localStorage.setItem("dayflow_user", JSON.stringify(updatedUser))
      
      // Load leave requests from localStorage or use mock data
      const storedRequests = localStorage.getItem("dayflow_leave_requests")
      let allRequests: any[] = []
      
      if (storedRequests) {
        try {
          allRequests = JSON.parse(storedRequests)
        } catch {
          allRequests = mockLeaveRequests
          localStorage.setItem("dayflow_leave_requests", JSON.stringify(mockLeaveRequests))
        }
      } else {
        allRequests = mockLeaveRequests
        localStorage.setItem("dayflow_leave_requests", JSON.stringify(mockLeaveRequests))
      }
      
      // Filter leave requests by user's ID (try both formats)
      const requests = allRequests.filter((lr) => lr.employeeId === emp.id || lr.employeeId === parsed.id)
      setLeaveRequests(requests)
    }
  }

  useEffect(() => {
    loadEmployee()
  }, [refreshKey])

  // Refresh leave data periodically to catch updates from admin
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1)
    }, 3000) // Check every 3 seconds
    
    return () => clearInterval(interval)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (employee && formData.startDate && formData.endDate && formData.reason) {
      // Load all leave requests from localStorage
      const storedRequests = localStorage.getItem("dayflow_leave_requests")
      let allRequests: any[] = []
      
      if (storedRequests) {
        try {
          allRequests = JSON.parse(storedRequests)
        } catch {
          allRequests = mockLeaveRequests
        }
      } else {
        allRequests = mockLeaveRequests
      }
      
      const newRequest = {
        id: `LR-${Date.now()}`, // Use timestamp for unique ID
        employeeId: employee.id,
        employeeName: employee.name,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: "pending",
        remarks: "",
        appliedDate: new Date().toISOString().split("T")[0],
      }
      
      // Add new request to all requests and save
      const updatedRequests = [newRequest, ...allRequests]
      localStorage.setItem("dayflow_leave_requests", JSON.stringify(updatedRequests))
      
      // Update local state with filtered requests for this employee
      const userRequests = updatedRequests.filter((lr) => lr.employeeId === employee.id)
      setLeaveRequests(userRequests)
      setFormData({ type: "paid", startDate: "", endDate: "", reason: "" })
      setShowForm(false)
    }
  }

  if (!employee) {
    return <div className="p-8">Loading...</div>
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground mt-2">Manage your leave applications</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Apply for Leave"}</Button>
      </div>

      {/* Apply Leave Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Apply for Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Leave Type</label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                    <Input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Textarea
                  name="reason"
                  placeholder="Provide a reason for your leave request..."
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Submit Request</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Leave Requests</CardTitle>
          <CardDescription>All your submitted leave applications</CardDescription>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No leave requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </p>
                    </div>
                    <Badge className={statusColors[request.status] || ""}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm">
                      <strong>Reason:</strong> {request.reason}
                    </p>
                  </div>
                  {request.remarks && (
                    <div>
                      <p className="text-sm">
                        <strong>Admin Comments:</strong> {request.remarks}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Applied on {request.appliedDate}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
