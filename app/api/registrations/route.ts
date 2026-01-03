import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Path to store registrations data
const DATA_FILE = path.join(process.cwd(), "data", "registrations.json")

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

// GET - Fetch all pending registrations
export async function GET() {
  try {
    const registrations = readRegistrations()
    const pending = registrations.filter((reg: any) => reg.status === "pending")
    return NextResponse.json({ success: true, data: pending })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch registrations" }, { status: 500 })
  }
}

// POST - Create a new pending registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.email || !body.password || !body.role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const registrations = readRegistrations()
    
    // Check for duplicate email
    const existingEmail = registrations.find((reg: any) => reg.email?.toLowerCase() === body.email.toLowerCase())
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      )
    }

    // Create new registration
    const newRegistration = {
      id: `PENDING-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      status: "pending",
      registrationDate: new Date().toISOString(),
    }

    registrations.push(newRegistration)
    writeRegistrations(registrations)

    return NextResponse.json({ success: true, data: newRegistration }, { status: 201 })
  } catch (error) {
    console.error("Error creating registration:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create registration" },
      { status: 500 }
    )
  }
}

