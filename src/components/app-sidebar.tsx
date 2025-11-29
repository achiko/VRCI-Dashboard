"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  TrendingUp,
  Package,
  Home,
  BarChart3,
  Coins,
  Wallet,
  Lock,
  ArrowLeftRight,
  Settings,
  FileCode,
  DollarSign,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Balance",
      url: "/balance",
      icon: DollarSign,
    },
    {
      title: "Contracts",
      icon: FileCode,
      items: [
        {
          title: "Oracle",
          url: "/oracle",
          icon: TrendingUp,
        },
        {
          title: "Registry",
          url: "/registry",
          icon: Package,
        },
        {
          title: "Token",
          url: "/token",
          icon: Coins,
        },
        {
          title: "Portfolio",
          url: "/portfolio",
          icon: Wallet,
        },
        {
          title: "Staking",
          url: "/staking",
          icon: Lock,
        },
        {
          title: "DEX",
          url: "/dex",
          icon: ArrowLeftRight,
        },
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Admin",
      url: "/admin",
      icon: Settings,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2 rounded-md transition-all duration-200 hover:bg-sidebar-accent/50 cursor-pointer group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:shadow-md">
            <span className="text-white font-bold text-sm">W3</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-lg transition-colors duration-200 group-hover:text-sidebar-accent-foreground">W3PI</span>
            <span className="truncate text-xs text-muted-foreground">Web3 Portfolio Intelligence</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

