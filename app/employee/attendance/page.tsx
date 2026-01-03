"use client"

import { useEffect, useState } from "react"
import { mockAttendance, mockEmployees } from "@/lib/mock-data"
import { loadEmployeeData } from "@/lib/employee-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

// Helper function to calculate hours worked
const calculateHours = (checkIn: string | null, checkOut: string | null): string => {
  if (!checkIn || !checkOut) return "-"

  // Convert time strings to minutes since midnight
  const parseTime = (timeStr: string): number => {
    // Handle both 12-hour format (with AM/PM) and 24-hour format
    const parts = timeStr.trim().split(" ")
    let time = parts[0]
    const period = parts[1]?.toUpperCase() // AM or PM

    const [hoursStr, minutesStr] = time.split(":")
    let hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr || "0", 10)

    // If period exists, it's 12-hour format
    if (period) {
      if (period === "PM" && hours !== 12) {
        hours += 12
      } else if (period === "AM" && hours === 12) {
        hours = 0
      }
    }

    return hours * 60 + minutes
  }

  try {
    const checkInMinutes = parseTime(checkIn)
    const checkOutMinutes = parseTime(checkOut)
    const diffMinutes = checkOutMinutes - checkInMinutes

    if (diffMinutes < 0) return "-" // Invalid time range

    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  } catch (error) {
    return "-"
  }
}

export default function AttendancePage() {
  const [employee, setEmployee] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  // Load attendance from localStorage or use mock data - ONLY for this employee
  const loadAttendance = (employeeId: string, email?: string) => {
    try {
      const stored = localStorage.getItem("dayflow_attendance")
      if (stored) {
        const allRecords = JSON.parse(stored)
        // Filter by employee ID (try both exact match and email match)
        const userRecords = allRecords.filter((r: any) => 
          r.employeeId === employeeId || 
          (email && r.employeeId === email) ||
          (email && r.email === email)
        )
        if (userRecords.length > 0) {
          return userRecords
        }
      }
    } catch (error) {
      console.error("Error loading attendance from localStorage:", error)
    }
    // Fallback to mock data filtered by employee ID - ONLY this employee's records
    return mockAttendance.filter((a) => a.employeeId === employeeId)
  }

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
      
      // Load attendance records - ONLY for this logged-in employee
      const records = loadAttendance(emp.id, parsed.email)
      setAttendanceRecords(records)
      
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

  const handleCheckIn = () => {
    if (!employee) return

    const today = new Date().toISOString().split("T")[0]
    const existing = attendanceRecords.find((a) => a.date === today)

    // Prevent multiple check-ins per day
    if (existing?.checkIn) {
      alert("You have already checked in today!")
      return
    }

    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    const newRecord = existing
      ? { ...existing, checkIn: now, status: "present" }
      : {
          id: `ATT-${Date.now()}`,
          employeeId: employee.id,
          date: today,
          status: "present",
          checkIn: now,
          checkOut: null,
        }

    const updatedRecords = existing
      ? attendanceRecords.map((a) => (a.date === today ? newRecord : a))
      : [newRecord, ...attendanceRecords]

    setAttendanceRecords(updatedRecords)

    // Persist to localStorage
    try {
      const stored = localStorage.getItem("dayflow_attendance")
      const allRecords = stored ? JSON.parse(stored) : []
      const filtered = allRecords.filter((r: any) => !(r.employeeId === employee.id && r.date === today))
      filtered.push(newRecord)
      localStorage.setItem("dayflow_attendance", JSON.stringify(filtered))
    } catch (error) {
      console.error("Error saving attendance to localStorage:", error)
    }
  }

  const handleCheckOut = () => {
    if (!employee) return

    const today = new Date().toISOString().split("T")[0]
    const existing = attendanceRecords.find((a) => a.date === today)

    // Prevent check-out without check-in
    if (!existing?.checkIn) {
      alert("Please check in first!")
      return
    }

    // Prevent multiple check-outs per day
    if (existing?.checkOut) {
      alert("You have already checked out today!")
      return
    }

    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    const updatedRecord = { ...existing, checkOut: now }

    const updatedRecords = attendanceRecords.map((a) => (a.date === today ? updatedRecord : a))
    setAttendanceRecords(updatedRecords)

    // Persist to localStorage
    try {
      const stored = localStorage.getItem("dayflow_attendance")
      const allRecords = stored ? JSON.parse(stored) : []
      const filtered = allRecords.filter((r: any) => !(r.employeeId === employee.id && r.date === today))
      filtered.push(updatedRecord)
      localStorage.setItem("dayflow_attendance", JSON.stringify(filtered))
    } catch (error) {
      console.error("Error saving attendance to localStorage:", error)
    }
  }

  if (!employee) {
    return <div className="p-8">Loading...</div>
  }

  const todayRecord = attendanceRecords.find((a) => a.date === new Date().toISOString().split("T")[0])
  const statusColors: Record<string, string> = {
    present: "bg-green-50 text-green-700 border-green-200",
    absent: "bg-red-50 text-red-700 border-red-200",
    "half-day": "bg-yellow-50 text-yellow-700 border-yellow-200",
    leave: "bg-blue-50 text-blue-700 border-blue-200",
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Attendance</h1>
        <p className="text-muted-foreground mt-2">Track your daily attendance and working hours</p>
      </div>

      {/* Check In/Out Card */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Check In/Out</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Check In Time</p>
              <p className="text-3xl font-bold">{todayRecord?.checkIn || "Not yet"}</p>
            </div>
            <div className="p-6 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Check Out Time</p>
              <p className="text-3xl font-bold">{todayRecord?.checkOut || "Not yet"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCheckIn} disabled={!!todayRecord?.checkIn} className="flex-1">
              <Clock className="h-4 w-4 mr-2" />
              Check In
            </Button>
            <Button
              onClick={handleCheckOut}
              disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
              variant="outline"
              className="flex-1 bg-transparent"
            >
              Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Attendance History</CardTitle>
          <CardDescription>Your personal attendance records for the past days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 font-medium">Date</th>
                  <th className="text-left py-3 font-medium">Status</th>
                  <th className="text-left py-3 font-medium">Check In</th>
                  <th className="text-left py-3 font-medium">Check Out</th>
                  <th className="text-left py-3 font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => {
                    const hours = calculateHours(record.checkIn, record.checkOut)
                    return (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="py-3">{record.date}</td>
                        <td className="py-3">
                          <Badge className={statusColors[record.status] || "bg-gray-50 text-gray-700 border-gray-200"}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3">{record.checkIn || "-"}</td>
                        <td className="py-3">{record.checkOut || "-"}</td>
                        <td className="py-3">{hours}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
