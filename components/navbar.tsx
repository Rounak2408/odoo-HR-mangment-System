"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Bell, Settings } from "lucide-react"

interface NavbarProps {
  user: any
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("dayflow_user")
    router.push("/auth/signin")
  }

  return (
    <div className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Welcome, {user?.name}</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
