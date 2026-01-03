"use client"

import { useMemo, useState, useEffect } from "react"
import { mockAttendance, mockEmployees } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, RefreshCw } from "lucide-react"

// Helper function to calculate hours worked (same as employee page)
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

export default function AttendanceManagementPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [allEmployees, setAllEmployees] = useState<any[]>(mockEmployees)
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<any[]>(mockAttendance)

  // Load all employees (including newly added ones from localStorage)
  useEffect(() => {
    try {
      const storedEmployees = localStorage.getItem("dayflow_employees")
      if (storedEmployees) {
        const parsed = JSON.parse(storedEmployees)
        const mockIds = new Set(mockEmployees.map((e) => e.id))
        const storedEmployeesList = parsed.filter((e: any) => !mockIds.has(e.id))
        setAllEmployees([...mockEmployees, ...storedEmployeesList])
      }
    } catch (error) {
      console.error("Error loading employees from localStorage:", error)
    }
  }, [])

  // Function to load attendance records
  const loadAttendanceRecords = () => {
    try {
      const stored = localStorage.getItem("dayflow_attendance")
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with mock data, prioritizing localStorage data
        const mockDates = new Set(
          mockAttendance.map((a) => `${a.employeeId}-${a.date}`)
        )
        const storedRecords = parsed.filter(
          (r: any) => !mockDates.has(`${r.employeeId}-${r.date}`)
        )
        setAllAttendanceRecords([...mockAttendance, ...storedRecords])
      } else {
        setAllAttendanceRecords(mockAttendance)
      }
    } catch (error) {
      console.error("Error loading attendance from localStorage:", error)
      setAllAttendanceRecords(mockAttendance)
    }
  }

  // Load all attendance records from localStorage
  useEffect(() => {
    loadAttendanceRecords()
    
    // Auto-refresh every 3 seconds to get latest attendance data
    const interval = setInterval(() => {
      loadAttendanceRecords()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Function to refresh all data
  const handleRefresh = () => {
    // Reload employees
    try {
      const storedEmployees = localStorage.getItem("dayflow_employees")
      if (storedEmployees) {
        const parsed = JSON.parse(storedEmployees)
        const mockIds = new Set(mockEmployees.map((e) => e.id))
        const storedEmployeesList = parsed.filter((e: any) => !mockIds.has(e.id))
        setAllEmployees([...mockEmployees, ...storedEmployeesList])
      }
    } catch (error) {
      console.error("Error loading employees from localStorage:", error)
    }
    
    // Reload attendance
    loadAttendanceRecords()
  }

  const statusColors: Record<string, string> = {
    present: "bg-green-50 text-green-700 border-green-200",
    absent: "bg-red-50 text-red-700 border-red-200",
    "half-day": "bg-yellow-50 text-yellow-700 border-yellow-200",
    leave: "bg-blue-50 text-blue-700 border-blue-200",
  }

  // Memoize filtered attendance for selected date
  const attendance = useMemo(
    () => allAttendanceRecords.filter((a) => a.date === selectedDate),
    [selectedDate, allAttendanceRecords],
  )

  // Memoize attendance counts - count unique employees, not records
  const stats = useMemo(() => {
    // Create a map of employee IDs to their attendance status for the selected date
    const employeeStatusMap = new Map<string, string>()
    
    attendance.forEach((record) => {
      const employeeId = record.employeeId
      // Determine status for this record
      let status = record.status
      if (!status) {
        if (record.checkIn && record.checkOut) {
          status = "present"
        } else if (record.checkIn && !record.checkOut) {
          status = "checked-in" // Not counted as present yet
        } else {
          status = "not-marked"
        }
      }
      // Only update if we haven't seen this employee yet, or if current status is more definitive
      if (!employeeStatusMap.has(employeeId) || status !== "not-marked") {
        employeeStatusMap.set(employeeId, status)
      }
    })

    // Count employees by status
    let presentCount = 0
    let absentCount = 0
    let halfDayCount = 0
    
    employeeStatusMap.forEach((status) => {
      if (status === "present") {
        presentCount++
      } else if (status === "absent") {
        absentCount++
      } else if (status === "half-day") {
        halfDayCount++
      }
    })

    // Not marked = total employees - employees with any attendance record
    const notMarkedCount = allEmployees.length - employeeStatusMap.size

    return {
      present: presentCount,
      absent: absentCount,
      halfDay: halfDayCount,
      notMarked: notMarkedCount,
    }
  }, [attendance, allEmployees.length])

  // Memoize attendance lookup map for O(1) access instead of O(n) find
  const attendanceMap = useMemo(() => {
    const map = new Map<string, typeof attendance[0]>()
    attendance.forEach((a) => {
      map.set(a.employeeId, a)
    })
    return map
  }, [attendance])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground mt-2">View and manage attendance records for all employees</p>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Half Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.halfDay}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Not Marked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.notMarked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>For {selectedDate}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 font-medium">Employee</th>
                  <th className="text-left py-3 font-medium">Employee ID</th>
                  <th className="text-left py-3 font-medium">Department</th>
                  <th className="text-left py-3 font-medium">Status</th>
                  <th className="text-left py-3 font-medium">Check In</th>
                  <th className="text-left py-3 font-medium">Check Out</th>
                  <th className="text-left py-3 font-medium">Hours</th>
                  <th className="text-center py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allEmployees.map((employee) => {
                  const record = attendanceMap.get(employee.id)
                  // Determine status based on record
                  let status = "Not Marked"
                  let statusClass = "bg-gray-50 text-gray-700 border-gray-200"
                  
                  if (record) {
                    if (record.status) {
                      status = record.status
                      statusClass = statusColors[record.status] || statusClass
                    } else if (record.checkIn && record.checkOut) {
                      status = "Present"
                      statusClass = statusColors.present
                    } else if (record.checkIn && !record.checkOut) {
                      status = "Checked In"
                      statusClass = "bg-blue-50 text-blue-700 border-blue-200"
                    }
                  }
                  
                  const hours = calculateHours(record?.checkIn || null, record?.checkOut || null)
                  
                  return (
                    <tr key={employee.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 font-medium">{employee.name}</td>
                      <td className="py-3 font-mono text-xs">{employee.id}</td>
                      <td className="py-3 text-muted-foreground">{employee.department || "-"}</td>
                      <td className="py-3">
                        <Badge className={statusClass}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3">{record?.checkIn || "-"}</td>
                      <td className="py-3">{record?.checkOut || "-"}</td>
                      <td className="py-3 font-medium">{hours}</td>
                      <td className="py-3 text-center">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </td>
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
