"use client"

import { useMemo } from "react"
import { mockEmployees, mockAttendance, mockLeaveRequests, mockPayrollData } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function ReportsPage() {
  // Memoize today's date
  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  // Memoize all report calculations
  const reportData = useMemo(() => {
    const monthAttendance = mockAttendance.filter((a) => a.date === today)
    const attendanceRate = (
      (monthAttendance.filter((a) => a.status === "present").length / mockEmployees.length) *
      100
    ).toFixed(1)

    // Calculate average salary from actual employee salaries (annual)
    const totalAnnualSalary = mockEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0)
    const avgAnnualSalary = totalAnnualSalary / mockEmployees.length
    const avgSalary = Number.parseFloat(avgAnnualSalary.toFixed(0))

    const approvedLeaves = mockLeaveRequests.filter((lr) => lr.status === "approved").length
    const totalLeaves = mockLeaveRequests.length
    const approvalRate = ((approvedLeaves / totalLeaves) * 100).toFixed(1)

    return {
      attendanceRate: Number.parseFloat(attendanceRate),
      avgSalary: avgSalary,
      leaveApprovalRate: Number.parseFloat(approvalRate),
      totalLeavesTaken: approvedLeaves,
    }
  }, [today])

  // Memoize employee performance data
  const employeePerformanceData = useMemo(() => {
    return mockEmployees.map((emp) => {
      const empAttendance = mockAttendance.filter((a) => a.employeeId === emp.id)
      const presentDays = empAttendance.filter((a) => a.status === "present").length
      const absentDays = empAttendance.filter((a) => a.status === "absent").length

      return {
        name: emp.name.split(" ")[0],
        present: presentDays,
        absent: absentDays,
      }
    })
  }, [])

  // Memoize leave distributions
  const leaveDistribution = useMemo(
    () => [
      { name: "Paid Leave", value: mockLeaveRequests.filter((lr) => lr.type === "paid").length },
      { name: "Sick Leave", value: mockLeaveRequests.filter((lr) => lr.type === "sick").length },
      { name: "Unpaid Leave", value: mockLeaveRequests.filter((lr) => lr.type === "unpaid").length },
    ],
    [],
  )

  const leaveStatusData = useMemo(
    () => [
      { name: "Approved", value: mockLeaveRequests.filter((lr) => lr.status === "approved").length },
      { name: "Pending", value: mockLeaveRequests.filter((lr) => lr.status === "pending").length },
      { name: "Rejected", value: mockLeaveRequests.filter((lr) => lr.status === "rejected").length },
    ],
    [],
  )

  // Memoize department analysis
  const departmentData = useMemo(() => {
    return ["Engineering", "Marketing", "HR"].map((dept) => {
      const deptEmployees = mockEmployees.filter((e) => e.department === dept)
      const deptPayroll = mockPayrollData.filter((p) => deptEmployees.some((e) => e.id === p.employeeId))
      const totalPayroll = deptPayroll.reduce((sum, p) => sum + p.netSalary, 0)
      const avgSalary = totalPayroll / deptEmployees.length
      return { dept, deptEmployees, avgSalary, totalPayroll }
    })
  }, [])

  const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)"]

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">Comprehensive HR analytics and insights</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {reportData.avgSalary >= 100000 
                ? `₹${(reportData.avgSalary / 100000).toFixed(1)}L` 
                : `₹${(reportData.avgSalary / 1000).toFixed(1)}K`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per employee (annual)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leave Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.leaveApprovalRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Approved requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leaves Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reportData.totalLeavesTaken}</div>
            <p className="text-xs text-muted-foreground mt-1">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Attendance</CardTitle>
            <CardDescription>Present vs Absent days</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeePerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="var(--color-chart-1)" />
                <Bar dataKey="absent" fill="var(--color-chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Type Distribution</CardTitle>
            <CardDescription>Breakdown by type</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leaveDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Leave Status Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Request Status</CardTitle>
          <CardDescription>Breakdown by approval status</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={leaveStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {leaveStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department-wise Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Analysis</CardTitle>
          <CardDescription>Employees and payroll by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 font-medium">Department</th>
                  <th className="text-center py-3 font-medium">Employees</th>
                  <th className="text-right py-3 font-medium">Avg Salary</th>
                  <th className="text-right py-3 font-medium">Total Payroll</th>
                </tr>
              </thead>
              <tbody>
                {departmentData.map(({ dept, deptEmployees, avgSalary, totalPayroll }) => (
                  <tr key={dept} className="border-b hover:bg-muted/50">
                    <td className="py-3 font-medium">{dept}</td>
                    <td className="py-3 text-center">{deptEmployees.length}</td>
                    <td className="py-3 text-right">
                      ₹{avgSalary.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-right font-bold">₹{totalPayroll.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Report Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Download Reports</CardTitle>
          <CardDescription>Export detailed reports for analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Attendance Report (PDF)
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Payroll Report (Excel)
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Leave Summary (CSV)
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Performance Report (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
