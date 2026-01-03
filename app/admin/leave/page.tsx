"use client"

import { useEffect, useState } from "react"
import { mockLeaveRequests } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle } from "lucide-react"

export default function LeaveApprovalsPage() {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Load leave requests from localStorage or use mock data
  useEffect(() => {
    const loadLeaveRequests = () => {
      try {
        const storedRequests = localStorage.getItem("dayflow_leave_requests")
        if (storedRequests) {
          const parsed = JSON.parse(storedRequests)
          // Ensure we have valid data
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLeaveRequests(parsed)
          } else {
            // Invalid data, reset to mock data
            setLeaveRequests(mockLeaveRequests)
            localStorage.setItem("dayflow_leave_requests", JSON.stringify(mockLeaveRequests))
          }
        } else {
          // First time - initialize with mock data
          setLeaveRequests(mockLeaveRequests)
          localStorage.setItem("dayflow_leave_requests", JSON.stringify(mockLeaveRequests))
        }
      } catch (error) {
        console.error("Error loading leave requests:", error)
        // If parsing fails, use mock data
        setLeaveRequests(mockLeaveRequests)
        localStorage.setItem("dayflow_leave_requests", JSON.stringify(mockLeaveRequests))
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaveRequests()
  }, [])

  // Save leave requests to localStorage whenever they change
  useEffect(() => {
    if (leaveRequests.length > 0 && !isLoading) {
      try {
        localStorage.setItem("dayflow_leave_requests", JSON.stringify(leaveRequests))
      } catch (error) {
        console.error("Error saving leave requests:", error)
      }
    }
  }, [leaveRequests, isLoading])

  const handleApprove = (id: string) => {
    const updatedRequests = leaveRequests.map((lr) =>
      lr.id === id
        ? {
            ...lr,
            status: "approved",
            remarks: comment || "Approved by admin",
          }
        : lr,
    )
    setLeaveRequests(updatedRequests)
    setSelectedRequest(null)
    setComment("")
  }

  const handleReject = (id: string) => {
    const updatedRequests = leaveRequests.map((lr) =>
      lr.id === id
        ? {
            ...lr,
            status: "rejected",
            remarks: comment || "Rejected by admin",
          }
        : lr,
    )
    setLeaveRequests(updatedRequests)
    setSelectedRequest(null)
    setComment("")
  }

  const pendingRequests = leaveRequests.filter((lr) => lr && lr.status === "pending")
  const processedRequests = leaveRequests.filter(
    (lr) => lr && lr.status && lr.status !== "pending" && (lr.status === "approved" || lr.status === "rejected")
  )

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  }

  const leaveTypeColors: Record<string, string> = {
    paid: "bg-blue-100 text-blue-800",
    sick: "bg-orange-100 text-orange-800",
    unpaid: "bg-gray-100 text-gray-800",
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-muted-foreground">Loading leave requests...</div>
      </div>
    )
  }

  const handleResetData = () => {
    if (confirm("Reset all leave requests to initial mock data? This will clear all approvals.")) {
      localStorage.setItem("dayflow_leave_requests", JSON.stringify(mockLeaveRequests))
      setLeaveRequests(mockLeaveRequests)
      setSelectedRequest(null)
      setComment("")
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Leave Approvals</h1>
          <p className="text-muted-foreground mt-2">Approve or reject employee leave requests</p>
        </div>
        <Button variant="outline" onClick={handleResetData} className="text-xs">
          Reset Data
        </Button>
      </div>

      {/* Pending Requests */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests ({pendingRequests.length})</CardTitle>
            <CardDescription>Awaiting your action</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending requests</div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedRequest?.id === request.id ? "bg-muted border-primary" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold">{request.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                      <Badge className={leaveTypeColors[request.type] || ""}>
                        {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {request.startDate} to {request.endDate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Panel */}
      {selectedRequest?.status === "pending" && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Review & Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Employee</p>
                <p className="font-medium">{selectedRequest.employeeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{selectedRequest.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {selectedRequest.startDate} to {selectedRequest.endDate}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Applied</p>
                <p className="font-medium">{selectedRequest.appliedDate}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Your Comments</label>
              <Textarea
                placeholder="Add comments (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleApprove(selectedRequest.id)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(selectedRequest.id)}
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Requests ({processedRequests.length})</CardTitle>
          <CardDescription>Approved or rejected requests</CardDescription>
        </CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No processed requests</p>
              <p className="text-xs mt-2">Approved or rejected requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processedRequests
                .sort((a, b) => {
                  // Sort by date, most recent first
                  const dateA = new Date(a.appliedDate || a.startDate).getTime()
                  const dateB = new Date(b.appliedDate || b.startDate).getTime()
                  return dateB - dateA
                })
                .map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-lg">{request.employeeName || "Unknown Employee"}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.type ? request.type.charAt(0).toUpperCase() + request.type.slice(1) + " Leave" : "Leave"} • {request.startDate} to {request.endDate}
                      </p>
                      {request.remarks && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{request.remarks}"</p>
                      )}
                      {request.appliedDate && (
                        <p className="text-xs text-muted-foreground mt-1">Applied on {request.appliedDate}</p>
                      )}
                    </div>
                    <Badge className={statusColors[request.status] || "bg-gray-100 text-gray-800"}>
                      {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : "Unknown"}
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
