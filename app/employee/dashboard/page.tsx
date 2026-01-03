"use client"

import { useEffect, useState, useMemo } from "react"
import { mockEmployees, mockAttendance, mockLeaveRequests, mockPayrollData } from "@/lib/mock-data"
import { loadEmployeeData } from "@/lib/employee-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { User, Clock, CreditCard, Calendar } from "lucide-react"

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadEmployee = () => {
    const userData = localStorage.getItem("dayflow_user")
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      
      // Load from localStorage employees (where admin updates are stored) or mock data
      const employeeData = loadEmployeeData(parsed.id, parsed.email)
      
      // Merge user session data with employee data (employee data from admin takes priority)
      const emp = {
        id: parsed.id,
        name: employeeData?.name || parsed.name || "Employee",
        email: parsed.email,
        department: employeeData?.department || parsed.department || "",
        position: employeeData?.position || parsed.position || "",
        salary: employeeData?.salary || parsed.salary || 0,
        phone: employeeData?.phone || parsed.phone || "",
        address: employeeData?.address || parsed.address || "",
        joinDate: employeeData?.joinDate || parsed.joinDate || "",
        ...employeeData, // Admin updates take priority
      }
      setEmployee(emp)
      
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
  }, [refreshKey])

  // Refresh employee data periodically to catch admin updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadEmployee()
      setRefreshKey((prev) => prev + 1)
    }, 3000) // Check every 3 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Memoize today's date
  const todayDate = useMemo(() => "2026-01-03", [])

  // Memoize all expensive lookups
  const todayAttendance = useMemo(
    () => (employee ? mockAttendance.find((a) => a.employeeId === employee.id && a.date === todayDate) : null),
    [employee, todayDate],
  )

  const pendingLeaves = useMemo(() => {
    if (!employee) return []
    
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
    
    return allRequests.filter((lr) => lr.employeeId === employee.id && lr.status === "pending")
  }, [employee, refreshKey])

  // Calculate current payroll from employee's salary (from admin updates)
  const currentPayroll = useMemo(() => {
    if (!employee) return null
    
    // Try to get from localStorage payroll first
    try {
      const storedPayroll = localStorage.getItem("dayflow_payroll")
      if (storedPayroll) {
        const allRecords = JSON.parse(storedPayroll)
        const userRecord = allRecords.find((p: any) => p.employeeId === employee.id)
        if (userRecord) {
          // Update base salary from current employee salary
          const annualSalary = employee.salary || 0
          const monthlyBaseSalary = annualSalary / 12
          const bonus = userRecord.bonus || 0
          const deductions = userRecord.deductions || 0
          return {
            ...userRecord,
            baseSalary: monthlyBaseSalary,
            netSalary: monthlyBaseSalary + bonus - deductions,
          }
        }
      }
    } catch (error) {
      console.error("Error loading payroll from localStorage:", error)
    }
    
    // Fallback: Calculate from employee's current salary
    const annualSalary = employee.salary || 0
    const monthlyBaseSalary = annualSalary / 12
    
    // Try to get bonus and deductions from mock data if available
    const mockRecord = mockPayrollData.find((p) => p.employeeId === employee.id)
    const bonus = mockRecord?.bonus || 0
    const deductions = mockRecord?.deductions || 0
    
    return {
      baseSalary: monthlyBaseSalary,
      bonus: bonus,
      deductions: deductions,
      netSalary: monthlyBaseSalary + bonus - deductions,
    }
  }, [employee])

  // Memoize recent attendance records
  const recentAttendance = useMemo(
    () => (employee ? mockAttendance.filter((a) => a.employeeId === employee.id).slice(0, 5) : []),
    [employee],
  )

  if (!employee) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {employee.name}</h1>
          <p className="text-muted-foreground mt-2">
            {employee.position} at {employee.department}
          </p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/employee/profile">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Profile</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employee.name}</div>
              <p className="text-xs text-muted-foreground">View & edit profile</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/employee/attendance">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAttendance?.status || "not marked"}</div>
              <p className="text-xs text-muted-foreground">
                {todayAttendance?.checkIn ? `In: ${todayAttendance.checkIn}` : "Not checked in"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/employee/leave">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
              <Calendar className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLeaves.length}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/employee/payroll">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payroll</CardTitle>
              <CreditCard className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{currentPayroll ? (currentPayroll.netSalary / 1000).toFixed(1) : "0"}K
              </div>
              <p className="text-xs text-muted-foreground">Monthly salary</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Pending Leave Requests */}
      {pendingLeaves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Requests</CardTitle>
            <CardDescription>You have {pendingLeaves.length} leave request(s) awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} Leave</p>
                    <p className="text-sm text-muted-foreground">
                      {leave.startDate} to {leave.endDate}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent check-ins and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttendance.map((attendance) => (
              <div key={attendance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{attendance.date}</p>
                  <p className="text-sm text-muted-foreground">
                    {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                  </p>
                </div>
                <div className="text-sm text-right">
                  {attendance.checkIn && (
                    <p>
                      {attendance.checkIn} - {attendance.checkOut}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
