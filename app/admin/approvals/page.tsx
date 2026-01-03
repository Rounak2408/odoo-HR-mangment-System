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
  }, [])

  const loadPendingRegistrations = () => {
    try {
      const stored = localStorage.getItem("dayflow_pending_registrations")
      if (stored) {
        const parsed = JSON.parse(stored)
        // Filter only pending registrations
        const pending = parsed.filter((reg: any) => reg.status === "pending")
        setPendingRegistrations(pending)
      }
    } catch (error) {
      console.error("Error loading pending registrations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (registration: any) => {
    try {
      // Remove from pending
      const stored = localStorage.getItem("dayflow_pending_registrations")
      if (stored) {
        const allRegistrations = JSON.parse(stored)
        const updated = allRegistrations.map((reg: any) =>
          reg.id === registration.id ? { ...reg, status: "approved", approvedDate: new Date().toISOString() } : reg
        )
        localStorage.setItem("dayflow_pending_registrations", JSON.stringify(updated))
      }

      // Add to approved users
      const approvedUsers = localStorage.getItem("dayflow_approved_users")
      const approvedList = approvedUsers ? JSON.parse(approvedUsers) : []
      
      // Create approved user object (without password in main storage, but keep it for login)
      const approvedUser = {
        id: registration.employeeId,
        employeeId: registration.employeeId,
        email: registration.email,
        name: registration.name,
        password: registration.password, // Keep password for login verification
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

      // If employee, also add to employees list
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

      // Reload pending registrations
      loadPendingRegistrations()
    } catch (error) {
      console.error("Error approving user:", error)
      alert("Error approving user. Please try again.")
    }
  }

  const handleReject = (registration: any) => {
    if (!confirm(`Are you sure you want to reject ${registration.name}'s registration?`)) {
      return
    }

    try {
      const stored = localStorage.getItem("dayflow_pending_registrations")
      if (stored) {
        const allRegistrations = JSON.parse(stored)
        const updated = allRegistrations.map((reg: any) =>
          reg.id === registration.id ? { ...reg, status: "rejected", rejectedDate: new Date().toISOString() } : reg
        )
        localStorage.setItem("dayflow_pending_registrations", JSON.stringify(updated))
      }

      loadPendingRegistrations()
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

