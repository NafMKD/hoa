"use client";

import * as React from "react";
import {
  Gauge,
  User2,
  DollarSign,
  BanknoteArrowDown,
  Settings,
  CarFront,
  BadgeInfo,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import { NavMain } from "@/admin/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "",
      icon: Gauge,
      isActive: true,
      items: [],
      link: true,
    },
    {
      title: "User Management",
      url: "/users",
      icon: User2,
      items: [
        { title: "All Users", url: "/users/all" },
        { title: "Add New", url: "/users/add" },
      ],
    },
    {
      title: "Financials",
      url: "/financials",
      icon: DollarSign,
      items: [
        { title: "Fees & Assessments", url: "/financials/fees" },
        { title: "Payments & Reconciliation", url: "/financials/payments" },
        { title: "Reports", url: "/financials/reports" },
      ],
    },
    {
      title: "Expenses & Payroll",
      url: "/expenses",
      icon: BanknoteArrowDown,
      items: [
        { title: "Expenses", url: "/expenses/list" },
        { title: "Payroll", url: "/expenses/payroll" },
      ],
    },
    {
      title: "Vehicle Management",
      url: "/vehicles",
      icon: CarFront,
      items: [
        { title: "Vehicles & Stickers", url: "/vehicles/list" },
        { title: "Lost / Replacement", url: "/vehicles/replacement" },
      ],
    },
    {
      title: "System & Settings",
      url: "/settings",
      icon: Settings,
      items: [
        { title: "Admin Users & Roles", url: "/settings/admins" },
        { title: "Audit Logs", url: "/settings/logs" },
        { title: "Integrations / Features", url: "/settings/integrations" },
      ],
    },
    {
      title: "Support",
      url: "/support",
      icon: BadgeInfo,
      items: [{ title: "Documentation", url: "/support/docs" }],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Avatar className="h-6 w-6 mr-2">
                  {/* If you have an image, place the src below */}
                  <AvatarImage src="" alt="NG" />
                  <AvatarFallback>NG</AvatarFallback>
                </Avatar>
                <span className="text-base font-semibold">Noah Garden HOA</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
