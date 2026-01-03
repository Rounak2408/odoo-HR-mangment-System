"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { mockEmployees, mockPayrollData } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit2, Save, X, Download } from "lucide-react"

export default function PayrollPage() {
  const [payrollRecords, setPayrollRecords] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState("December 2025")

  useEffect(() => {
    setPayrollRecords(mockPayrollData)
  }, [])

  const handleEdit = (record: any) => {
    setEditingId(record.id)
    setEditingData({ ...record })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditingData((prev: any) => ({
      ...prev,
      [name]: name === "month" ? value : Number.parseFloat(value) || 0,
    }))
  }

  const handleSave = () => {
    setPayrollRecords(payrollRecords.map((record) => (record.id === editingId ? editingData : record)))
    setEditingId(null)
    setEditingData(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const getTotalPayroll = () => {
    return payrollRecords.reduce((sum, record) => sum + record.netSalary, 0)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="text-muted-foreground mt-2">Manage salary structures and payroll records</p>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEmployees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Monthly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(getTotalPayroll() / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(getTotalPayroll() / mockEmployees.length / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payroll Month</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-sm border rounded px-2 py-1"
              aria-label="Select payroll month"
            >
              <option>December 2025</option>
              <option>November 2025</option>
              <option>October 2025</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Details</CardTitle>
          <CardDescription>Manage employee salaries and benefits for {selectedMonth}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 font-medium">Employee</th>
                  <th className="text-right py-3 font-medium">Base Salary</th>
                  <th className="text-right py-3 font-medium">Bonus</th>
                  <th className="text-right py-3 font-medium">Deductions</th>
                  <th className="text-right py-3 font-medium">Net Salary</th>
                  <th className="text-center py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollRecords.map((record) => {
                  const employee = mockEmployees.find((e) => e.id === record.employeeId)
                  return (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      {editingId === record.id ? (
                        <>
                          <td className="py-3">{employee?.name}</td>
                          <td className="py-3 text-right">
                            <Input
                              type="number"
                              name="baseSalary"
                              value={editingData.baseSalary}
                              onChange={handleInputChange}
                              className="text-right max-w-xs ml-auto"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <Input
                              type="number"
                              name="bonus"
                              value={editingData.bonus}
                              onChange={handleInputChange}
                              className="text-right max-w-xs ml-auto"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <Input
                              type="number"
                              name="deductions"
                              value={editingData.deductions}
                              onChange={handleInputChange}
                              className="text-right max-w-xs ml-auto"
                            />
                          </td>
                          <td className="py-3 text-right">
                            <Input
                              type="number"
                              name="netSalary"
                              value={editingData.netSalary}
                              onChange={handleInputChange}
                              className="text-right max-w-xs ml-auto"
                            />
                          </td>
                          <td className="py-3 text-center flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleSave}
                              className="flex items-center gap-1 bg-transparent"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="flex items-center gap-1 bg-transparent"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 font-medium">{employee?.name}</td>
                          <td className="py-3 text-right">₹{record.baseSalary.toLocaleString()}</td>
                          <td className="py-3 text-right text-green-600">+₹{record.bonus.toLocaleString()}</td>
                          <td className="py-3 text-right text-red-600">-₹{record.deductions.toLocaleString()}</td>
                          <td className="py-3 text-right font-bold">₹{record.netSalary.toLocaleString()}</td>
                          <td className="py-3 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(record)}
                              className="flex items-center gap-1 mx-auto"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="border-t font-bold">
                <tr>
                  <td className="py-3">Total</td>
                  <td className="py-3 text-right">
                    ₹{payrollRecords.reduce((sum, r) => sum + r.baseSalary, 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-green-600">
                    ₹{payrollRecords.reduce((sum, r) => sum + r.bonus, 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right text-red-600">
                    ₹{payrollRecords.reduce((sum, r) => sum + r.deductions, 0).toLocaleString()}
                  </td>
                  <td className="py-3 text-right">₹{getTotalPayroll().toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Salary Structure Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Distribution</CardTitle>
          <CardDescription>Analysis by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["Engineering", "Marketing", "HR"].map((dept) => {
              const deptEmployees = mockEmployees.filter((e) => e.department === dept)
              const deptPayroll = payrollRecords.filter((r) => deptEmployees.some((e) => e.id === r.employeeId))
              const totalSalary = deptPayroll.reduce((sum, p) => sum + p.netSalary, 0)
              return (
                <div key={dept} className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{dept}</h4>
                    <Badge variant="secondary">{deptEmployees.length} employees</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Payroll</span>
                    <span className="font-bold">₹{totalSalary.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Payroll
          </Button>
          <Button variant="outline">Generate Payslips</Button>
          <Button variant="outline">Calculate Tax</Button>
        </CardContent>
      </Card>
    </div>
  )
}
