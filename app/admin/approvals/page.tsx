"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, User, Mail, Phone, Building, Briefcase, Shield } from "lucide-react"

export default function UserApprovalsPage() {
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingRegistrations()
    // Auto-refresh every 3 seconds to get new registrations
    const interval = setInterval(() => {
      loadPendingRegistrations()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadPendingRegistrations = async () => {
    try {
      const response = await fetch("/api/registrations")
      const result = await response.json()
      if (result.success) {
        setPendingRegistrations(result.data || [])
      } else {
        console.error("Error loading pending registrations:", result.error)
        setPendingRegistrations([])
      }
    } catch (error) {
      console.error("Error loading pending registrations:", error)
      setPendingRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (registration: any) => {
    try {
      const response = await fetch(`/api/registrations/${registration.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      })

      const result = await response.json()
      if (result.success) {
        alert(`User ${registration.name} has been approved successfully!`)
        // Also sync to localStorage for backward compatibility
        try {
          const approvedUsers = localStorage.getItem("dayflow_approved_users")
          const approvedList = approvedUsers ? JSON.parse(approvedUsers) : []
          const approvedUser = {
            id: registration.employeeId,
            employeeId: registration.employeeId,
            email: registration.email,
            name: registration.name,
            password: registration.password,
            role: registration.role,
            status: "approved",
            approvedDate: new Date().toISOString(),
            ...(registration.department && { department: registration.department }),
            ...(registration.position && { position: registration.position }),
            ...(registration.phone && { phone: registration.phone }),
            ...(registration.adminCode && { adminCode: registration.adminCode }),
            ...(registration.organizationName && { organizationName: registration.organizationName }),
            ...(registration.permissions && { permissions: registration.permissions }),
          }
          approvedList.push(approvedUser)
          localStorage.setItem("dayflow_approved_users", JSON.stringify(approvedList))

          if (registration.role === "employee") {
            const storedEmployees = localStorage.getItem("dayflow_employees")
            const employeesList = storedEmployees ? JSON.parse(storedEmployees) : []
            employeesList.push({
              id: registration.employeeId,
              name: registration.name,
              email: registration.email,
              department: registration.department || "",
              position: registration.position || "",
              phone: registration.phone || "",
              joinDate: new Date().toISOString().split("T")[0],
              salary: 50000,
              profileImage: "/diverse-avatars.png",
              address: "",
              emergencyContact: "",
              emergencyPhone: "",
            })
            localStorage.setItem("dayflow_employees", JSON.stringify(employeesList))
          }
        } catch (localError) {
          console.error("Error syncing to localStorage:", localError)
        }
        // Reload pending registrations
        loadPendingRegistrations()
      } else {
        alert(result.error || "Error approving user. Please try again.")
      }
    } catch (error) {
      console.error("Error approving user:", error)
      alert("Error approving user. Please try again.")
    }
  }

  const handleReject = async (registration: any) => {
    if (!confirm(`Are you sure you want to reject ${registration.name}'s registration?`)) {
      return
    }

    try {
      const response = await fetch(`/api/registrations/${registration.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      })

      const result = await response.json()
      if (result.success) {
        alert(`User ${registration.name}'s registration has been rejected.`)
        // Reload pending registrations
        loadPendingRegistrations()
      } else {
        alert(result.error || "Error rejecting user. Please try again.")
      }
    } catch (error) {
      console.error("Error rejecting user:", error)
      alert("Error rejecting user. Please try again.")
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Approvals</h1>
        <p className="text-muted-foreground mt-2">Review and approve pending user registrations</p>
      </div>

      {pendingRegistrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No pending registrations. All users have been reviewed.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingRegistrations.map((registration) => (
            <Card key={registration.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {registration.role === "admin" ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{registration.name}</CardTitle>
                      <Badge className={registration.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                        {registration.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{registration.email}</span>
                  </div>
                  {registration.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{registration.phone}</span>
                    </div>
                  )}
                  {registration.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{registration.department}</span>
                    </div>
                  )}
                  {registration.position && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>{registration.position}</span>
                    </div>
                  )}
                  {registration.employeeId && (
                    <div className="text-xs text-muted-foreground">
                      <strong>ID:</strong> {registration.employeeId}
                    </div>
                  )}
                  {registration.organizationName && (
                    <div className="text-xs text-muted-foreground">
                      <strong>Organization:</strong> {registration.organizationName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    <strong>Registered:</strong> {new Date(registration.registrationDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(registration)}
                    className="flex-1"
                    size="sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(registration)}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

