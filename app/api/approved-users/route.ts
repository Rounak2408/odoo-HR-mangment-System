import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// Path to store approved users data
const DATA_FILE = path.join(process.cwd(), "data", "approved-users.json")

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read approved users from file
function readApprovedUsers() {
  ensureDataDir()
  if (!fs.existsSync(DATA_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(DATA_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading approved users:", error)
    return []
  }
}

// GET - Fetch all approved users or search by email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")

    const approvedUsers = readApprovedUsers()

    if (email) {
      const normalizedEmail = email.toLowerCase().trim()
      const user = approvedUsers.find(
        (u: any) => u.email?.toLowerCase().trim() === normalizedEmail
      )
      if (user) {
        return NextResponse.json({ success: true, data: user })
      } else {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
    }

    return NextResponse.json({ success: true, data: approvedUsers })
  } catch (error) {
    console.error("Error fetching approved users:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch approved users" },
      { status: 500 }
    )
  }
}

