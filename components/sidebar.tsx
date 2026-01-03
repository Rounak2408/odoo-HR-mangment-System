"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, User, Clock, Calendar, CreditCard, BarChart3, Users, CheckSquare, UserCheck } from "lucide-react"

interface SidebarProps {
  role: "employee" | "admin"
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const employeeLinks = [
    { href: "/employee/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/profile", label: "Profile", icon: User },
    { href: "/employee/attendance", label: "Attendance", icon: Clock },
    { href: "/employee/leave", label: "Leave", icon: Calendar },
    { href: "/employee/payroll", label: "Payroll", icon: CreditCard },
  ]

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/attendance", label: "Attendance", icon: Clock },
    { href: "/admin/leave", label: "Leave Approvals", icon: CheckSquare },
    { href: "/admin/approvals", label: "User Approvals", icon: UserCheck },
    { href: "/admin/payroll", label: "Payroll", icon: CreditCard },
    { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  ]

  const links = role === "employee" ? employeeLinks : adminLinks

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link
          href={role === "employee" ? "/employee/dashboard" : "/admin/dashboard"}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold">D</span>
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">Odoo Hackathon '26</h1>
            <p className="text-xs text-sidebar-accent">{role === "admin" ? "Admin" : "Employee"}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              pathname === href
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        <p>© 2025 Odoo Hackathon '26</p>
      </div>
    </div>
  )
}
