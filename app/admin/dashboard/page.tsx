"use client"

import { useMemo, useState, useEffect } from "react"
import { mockEmployees, mockAttendance, mockLeaveRequests } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, FileText, CheckSquare } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [admin, setAdmin] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem("dayflow_user")
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      // Use the logged-in user's data directly, or try to find in mockEmployees if needed
      const foundEmployee = mockEmployees.find((e) => e.id === parsed.id || e.email === parsed.email)
      // Use actual user data with fallback to mock data for missing fields
      setAdmin({
        id: parsed.id,
        name: parsed.name || foundEmployee?.name || "Administrator",
        email: parsed.email,
        department: parsed.department || foundEmployee?.department || "Administration",
        position: parsed.position || foundEmployee?.position || "Administrator",
        ...foundEmployee, // Merge any additional fields from mock data
      })
    }
  }, [])

  // Memoize today's date string
  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  // Memoize all expensive calculations - filtered by logged-in admin
  const stats = useMemo(() => {
    if (!admin) return { totalEmployees: 0, presentToday: 0, pendingLeaves: 0, onLeave: 0 }

    // Check attendance from localStorage first, then mock data
    let adminAttendance: any[] = []
    try {
      const storedAttendance = localStorage.getItem("dayflow_attendance")
      if (storedAttendance) {
        const allRecords = JSON.parse(storedAttendance)
        adminAttendance = allRecords.filter((a: any) => 
          (a.employeeId === admin.id || a.email === admin.email) && a.date === today
        )
      }
    } catch (error) {
      console.error("Error loading attendance from localStorage:", error)
    }
    
    // Fallback to mock data if no localStorage records found
    if (adminAttendance.length === 0) {
      adminAttendance = mockAttendance.filter((a) => 
        a.employeeId === admin.id && a.date === today
      )
    }
    
    // Determine status: present if checked in and out, checked-in if only checked in, not marked otherwise
    let presentCount = 0
    if (adminAttendance.length > 0) {
      const record = adminAttendance[0]
      if (record.status === "present" || (record.checkIn && record.checkOut)) {
        presentCount = 1
      }
    }

    // Load leave requests from localStorage or use mock data
    const storedRequests = localStorage.getItem("dayflow_leave_requests")
    let allLeaveRequests: any[] = []
    
    if (storedRequests) {
      try {
        allLeaveRequests = JSON.parse(storedRequests)
      } catch {
        allLeaveRequests = mockLeaveRequests
      }
    } else {
      allLeaveRequests = mockLeaveRequests
    }

    // Filter leave requests for this admin only
    const adminLeaveRequests = allLeaveRequests.filter((lr) => lr.employeeId === admin.id)
    const pendingCount = adminLeaveRequests.filter((lr) => lr.status === "pending").length
    const onLeaveCount = adminLeaveRequests.filter(
      (lr) =>
        lr.status === "approved" &&
        new Date(lr.startDate) <= new Date(today) &&
        new Date(lr.endDate) >= new Date(today),
    ).length

    return {
      totalEmployees: 1, // Only showing this admin
      presentToday: presentCount,
      pendingLeaves: pendingCount,
      onLeave: onLeaveCount,
    }
  }, [today, admin])

  // Memoize pending leave requests - filtered by logged-in admin, using persisted data
  const pendingLeaveRequests = useMemo(() => {
    if (!admin) return []
    
    // Load from localStorage first, fallback to mock data
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
    
    return allRequests.filter((lr) => lr.employeeId === admin.id && lr.status === "pending").slice(0, 5)
  }, [admin])

  // Memoize pending user registrations count
  const pendingRegistrationsCount = useMemo(() => {
    try {
      const stored = localStorage.getItem("dayflow_pending_registrations")
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.filter((reg: any) => reg.status === "pending").length
      }
    } catch (error) {
      console.error("Error loading pending registrations:", error)
    }
    return 0
  }, [])

  // Memoize chart data
  const attendanceTrendData = useMemo(
    () => [
      { date: "Jan 1", present: 2, absent: 1, halfDay: 0 },
      { date: "Jan 2", present: 3, absent: 0, halfDay: 1 },
      { date: "Jan 3", present: 2, absent: 0, halfDay: 1 },
    ],
    [],
  )

  const leaveDistributionData = useMemo(
    () => [
      { type: "Paid Leave", count: 1, fill: "var(--color-chart-1)" },
      { type: "Sick Leave", count: 1, fill: "var(--color-chart-2)" },
      { type: "Unpaid Leave", count: 1, fill: "var(--color-chart-3)" },
    ],
    [],
  )

  if (!admin) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {admin.name}</h1>
        <p className="text-muted-foreground mt-2">Your personal dashboard overview</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Profile</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.name}</div>
            <p className="text-xs text-muted-foreground">{admin.position || "Administrator"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                // Check if admin has attendance record for today
                try {
                  const storedAttendance = localStorage.getItem("dayflow_attendance")
                  if (storedAttendance) {
                    const allRecords = JSON.parse(storedAttendance)
                    const todayRecord = allRecords.find((a: any) => 
                      (a.employeeId === admin.id || a.email === admin.email) && a.date === today
                    )
                    if (todayRecord) {
                      if (todayRecord.status === "present" || (todayRecord.checkIn && todayRecord.checkOut)) {
                        return "Present"
                      } else if (todayRecord.checkIn && !todayRecord.checkOut) {
                        return "Checked In"
                      }
                    }
                  }
                } catch (error) {
                  console.error("Error checking attendance:", error)
                }
                // Check mock data as fallback
                const mockRecord = mockAttendance.find((a) => 
                  a.employeeId === admin.id && a.date === today
                )
                if (mockRecord && (mockRecord.status === "present" || (mockRecord.checkIn && mockRecord.checkOut))) {
                  return "Present"
                }
                return "Not Marked"
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Your attendance today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Leave Requests</CardTitle>
            <CheckSquare className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </CardContent>
        </Card>

        {pendingRegistrationsCount > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending User Approvals</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingRegistrationsCount}</div>
              <p className="text-xs text-muted-foreground">
                <a href="/admin/approvals" className="text-orange-600 hover:underline">
                  Review registrations
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <FileText className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onLeave > 0 ? "Yes" : "No"}</div>
            <p className="text-xs text-muted-foreground">Your leave status</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Last 3 days</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="var(--color-chart-1)" />
                <Line type="monotone" dataKey="absent" stroke="var(--color-chart-3)" />
                <Line type="monotone" dataKey="halfDay" stroke="var(--color-chart-2)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Distribution</CardTitle>
            <CardDescription>By type</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* My Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
          <CardDescription>Your pending leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingLeaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No pending leave requests</div>
          ) : (
            <div className="space-y-3">
              {pendingLeaveRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.startDate} to {request.endDate}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
