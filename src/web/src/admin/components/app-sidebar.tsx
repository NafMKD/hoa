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
      url: "/admin",
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
        { title: "Add New", url: "/admin/users/add" },
        { title: "All Users", url: "/admin/users/all" },
      ],
    },
    {
      title: "Financials",
      url: "/financials",
      icon: DollarSign,
      items: [
        { title: "Invoices", url: "/admin/financials/invoices" },
        { title: "Payments", url: "/admin/financials/payments" },
        { title: "Reconciliation ", url: "/admin/financials/reconciliation" },
        { title: "Reports", url: "/admin/financials/reports" },
      ],
    },
    {
      title: "Expenses & Payroll",
      url: "/expenses",
      icon: BanknoteArrowDown,
      items: [
        { title: "Expenses", url: "/admin/expenses/list" },
        { title: "Payroll", url: "/admin/expenses/payroll" },
      ],
    },
    {
      title: "Vehicle Management",
      url: "/vehicles",
      icon: CarFront,
      items: [
        { title: "Vehicles", url: "/admin/vehicles/list" },
        { title: "Stickers", url: "/admin/vehicles/stickers" },
        { title: "Lost / Replacement", url: "/admin/vehicles/replacement" },
      ],
    },
    {
      title: "System & Settings",
      url: "/settings",
      icon: Settings,
      items: [
        { title: "Admin Roles", url: "/admin/settings/roles" },
        { title: "Audit Logs", url: "/admin/settings/logs" },
      ],
    },
    {
      title: "Support",
      url: "/support",
      icon: BadgeInfo,
      items: [{ title: "Documentation", url: "/admin/support/docs" }],
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
