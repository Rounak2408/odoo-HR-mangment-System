import { mockEmployees } from "./mock-data"

/**
 * Load employee data from localStorage (where admin updates are stored) or fall back to mock data
 * Priority: localStorage employees > mock employees
 */
export const loadEmployeeData = (employeeId: string, email?: string) => {
  let employee = null
  
  // First check localStorage (where admin updates are stored)
  try {
    const storedEmployees = localStorage.getItem("dayflow_employees")
    if (storedEmployees) {
      const parsed = JSON.parse(storedEmployees)
      // Try to find by ID first, then by email
      employee = parsed.find((e: any) => 
        e.id === employeeId || e.id === email || e.email === email
      )
    }
  } catch (error) {
    console.error("Error loading employee from localStorage:", error)
  }
  
  // If not found in localStorage, check mock employees
  if (!employee) {
    employee = mockEmployees.find((e) => 
      e.id === employeeId || e.id === email || e.email === email
    )
  }
  
  return employee
}

/**
 * Get all employees from localStorage and mock data
 * Priority: localStorage employees override mock employees
 */
export const getAllEmployees = () => {
  const allEmployees: any[] = []
  
  // Get employees from localStorage (edited/updated by admin)
  try {
    const storedEmployees = localStorage.getItem("dayflow_employees")
    if (storedEmployees) {
      const parsed = JSON.parse(storedEmployees)
      allEmployees.push(...parsed)
    }
  } catch (error) {
    console.error("Error loading employees from localStorage:", error)
  }
  
  // Get IDs of employees in localStorage
  const storedIds = new Set(allEmployees.map((e) => e.id))
  
  // Add mock employees that are NOT in localStorage (not yet edited)
  const mockOnly = mockEmployees.filter((e) => !storedIds.has(e.id))
  allEmployees.push(...mockOnly)
  
  return allEmployees
}

