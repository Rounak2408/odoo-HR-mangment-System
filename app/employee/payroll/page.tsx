"use client"

import { useEffect, useState } from "react"
import { mockPayrollData, mockEmployees } from "@/lib/mock-data"
import { loadEmployeeData } from "@/lib/employee-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export default function PayrollPage() {
  const [employee, setEmployee] = useState<any>(null)
  const [payrollRecords, setPayrollRecords] = useState<any[]>([])

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
        salary: employeeData?.salary || parsed.salary || 0,
        ...employeeData, // Admin updates take priority
      }
      setEmployee(emp)
      
      // Calculate payroll from employee's current salary (from admin updates)
      // Load payroll records from localStorage or use mock data as base
      const storedPayroll = localStorage.getItem("dayflow_payroll")
      let allPayrollRecords: any[] = []
      
      if (storedPayroll) {
        try {
          allPayrollRecords = JSON.parse(storedPayroll)
        } catch {
          allPayrollRecords = mockPayrollData
        }
      } else {
        allPayrollRecords = mockPayrollData
      }
      
      // Filter payroll by user's ID
      let userPayrollRecords = allPayrollRecords.filter((p) => p.employeeId === emp.id || p.employeeId === parsed.id)
      
      // Get current month
      const currentDate = new Date()
      const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
      
      // Calculate monthly base salary from annual salary (employee.salary is annual)
      const annualSalary = emp.salary || 0
      const monthlyBaseSalary = annualSalary / 12
      
      // Find or create current month's payroll record
      let currentMonthRecord = userPayrollRecords.find((p) => p.month === currentMonth)
      
      if (!currentMonthRecord) {
        // Create new payroll record for current month based on updated salary
        currentMonthRecord = {
          id: `PAY-${emp.id}-${Date.now()}`,
          employeeId: emp.id,
          month: currentMonth,
          baseSalary: monthlyBaseSalary,
          bonus: 0,
          deductions: 0,
          netSalary: monthlyBaseSalary,
        }
        userPayrollRecords.unshift(currentMonthRecord) // Add to beginning
      } else {
        // Update existing current month record with new salary
        const bonus = currentMonthRecord.bonus || 0
        const deductions = currentMonthRecord.deductions || 0
        currentMonthRecord = {
          ...currentMonthRecord,
          baseSalary: monthlyBaseSalary,
          netSalary: monthlyBaseSalary + bonus - deductions,
        }
        // Update in the array
        const index = userPayrollRecords.findIndex((p) => p.month === currentMonth)
        if (index !== -1) {
          userPayrollRecords[index] = currentMonthRecord
        }
      }
      
      // Save updated payroll to localStorage
      try {
        const allRecords = storedPayroll ? JSON.parse(storedPayroll) : mockPayrollData
        const otherRecords = allRecords.filter((p: any) => p.employeeId !== emp.id && p.employeeId !== parsed.id)
        const updatedAllRecords = [...otherRecords, ...userPayrollRecords]
        localStorage.setItem("dayflow_payroll", JSON.stringify(updatedAllRecords))
      } catch (error) {
        console.error("Error saving payroll to localStorage:", error)
      }
      
      setPayrollRecords(userPayrollRecords)
      
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

  if (!employee) {
    return <div className="p-8">Loading...</div>
  }

  // Calculate current payroll from employee salary if no records exist
  const getCurrentPayroll = () => {
    if (payrollRecords.length > 0) {
      return payrollRecords[0]
    }
    
    // Fallback: Calculate from current salary
    const annualSalary = employee.salary || 0
    const monthlyBaseSalary = annualSalary / 12
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    
    return {
      month: currentMonth,
      baseSalary: monthlyBaseSalary,
      bonus: 0,
      deductions: 0,
      netSalary: monthlyBaseSalary,
    }
  }

  const latestPayroll = getCurrentPayroll()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll</h1>
        <p className="text-muted-foreground mt-2">View your salary information and payslips</p>
      </div>

      {/* Current Salary Summary */}
      <Card>
          <CardHeader>
            <CardTitle>Current Payroll - {latestPayroll.month}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Base Salary</p>
                <p className="text-2xl font-bold mt-2">₹{latestPayroll.baseSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Bonus</p>
                <p className="text-2xl font-bold mt-2">+₹{latestPayroll.bonus.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-2xl font-bold mt-2">-₹{latestPayroll.deductions.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Net Salary</p>
                <p className="text-2xl font-bold mt-2">₹{latestPayroll.netSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>Your recent payroll records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 font-medium">Month</th>
                  <th className="text-right py-3 font-medium">Base Salary</th>
                  <th className="text-right py-3 font-medium">Bonus</th>
                  <th className="text-right py-3 font-medium">Deductions</th>
                  <th className="text-right py-3 font-medium">Net Salary</th>
                  <th className="text-center py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {payrollRecords.length > 0 ? (
                  payrollRecords.map((payroll) => (
                    <tr key={payroll.id || payroll.month} className="border-b hover:bg-muted/50">
                      <td className="py-3">{payroll.month}</td>
                      <td className="py-3 text-right">₹{payroll.baseSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td className="py-3 text-right text-green-600">+₹{payroll.bonus.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td className="py-3 text-right text-red-600">-₹{payroll.deductions.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td className="py-3 text-right font-bold">₹{payroll.netSalary.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                      <td className="py-3 text-center">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No payroll records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
