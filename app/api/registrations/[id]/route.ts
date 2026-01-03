import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Path to store registrations data
const DATA_FILE = path.join(process.cwd(), "data", "registrations.json")
const APPROVED_USERS_FILE = path.join(process.cwd(), "data", "approved-users.json")
const EMPLOYEES_FILE = path.join(process.cwd(), "data", "employees.json")

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read registrations from file
function readRegistrations() {
  ensureDataDir()
  if (!fs.existsSync(DATA_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading registrations:", error)
    return []
  }
}

// Write registrations to file
function writeRegistrations(registrations: any[]) {
  ensureDataDir()
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(registrations, null, 2), "utf-8")
  } catch (error) {
    console.error("Error writing registrations:", error)
    throw error
  }
}

// Read approved users
function readApprovedUsers() {
  ensureDataDir()
  if (!fs.existsSync(APPROVED_USERS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(APPROVED_USERS_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading approved users:", error)
    return []
  }
}

// Write approved users
function writeApprovedUsers(users: any[]) {
  ensureDataDir()
  try {
    fs.writeFileSync(APPROVED_USERS_FILE, JSON.stringify(users, null, 2), "utf-8")
  } catch (error) {
    console.error("Error writing approved users:", error)
    throw error
  }
}

// Read employees
function readEmployees() {
  ensureDataDir()
  if (!fs.existsSync(EMPLOYEES_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(EMPLOYEES_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading employees:", error)
    return []
  }
}

// Write employees
function writeEmployees(employees: any[]) {
  ensureDataDir()
  try {
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employees, null, 2), "utf-8")
  } catch (error) {
    console.error("Error writing employees:", error)
    throw error
  }
}

// PATCH - Approve or reject a registration
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { action } = body // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    const registrations = readRegistrations()
    const registration = registrations.find((reg: any) => reg.id === id)

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "Registration not found" },
        { status: 404 }
      )
    }

    if (action === "approve") {
      // Update registration status
      const updatedRegistrations = registrations.map((reg: any) =>
        reg.id === id
          ? { ...reg, status: "approved", approvedDate: new Date().toISOString() }
          : reg
      )
      writeRegistrations(updatedRegistrations)

      // Add to approved users
      const approvedUsers = readApprovedUsers()
      const approvedUser = {
        id: registration.employeeId || registration.id,
        employeeId: registration.employeeId || registration.id,
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
      approvedUsers.push(approvedUser)
      writeApprovedUsers(approvedUsers)

      // If employee, also add to employees list
      if (registration.role === "employee") {
        const employees = readEmployees()
        employees.push({
          id: registration.employeeId || registration.id,
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
        writeEmployees(employees)
      }

      return NextResponse.json({ success: true, data: approvedUser })
    } else {
      // Reject registration
      const updatedRegistrations = registrations.map((reg: any) =>
        reg.id === id
          ? { ...reg, status: "rejected", rejectedDate: new Date().toISOString() }
          : reg
      )
      writeRegistrations(updatedRegistrations)

      return NextResponse.json({ success: true, message: "Registration rejected" })
    }
  } catch (error) {
    console.error("Error updating registration:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update registration" },
      { status: 500 }
    )
  }
}

