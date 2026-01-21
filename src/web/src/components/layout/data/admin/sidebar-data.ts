import {
  LayoutDashboard,
  Users,
  Building,
  Home,
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  Wallet,
  BarChart3,
  Car,
  Vote,
  Inbox,
  FileSignature,
  MessageSquareWarning,
  HelpCircle,
  FileArchive,
  UserCheck,
} from "lucide-react";
import { type SidebarData } from "@/components/layout/types";

export const sidebarData: SidebarData = {
  user: {
    name: "Admin User",
    email: "admin@gmail.com",
    avatar: "/avatars/admin.jpg",
  },
  navGroups: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Users & Properties",
      items: [
        {
          title: "Users",
          url: "/admin/users",
          icon: Users,
        },
        {
          title: "Buildings",
          url: "/admin/buildings",
          icon: Building,
        },
        {
          title: "Units",
          url: "/admin/units",
          icon: Home,
        },
        {
          title: "Employees",
          url: "/admin/employees",
          icon: UserCheck,
        },
      ],
    },
    {
      title: "Financials",
      items: [
        {
          title: "Fees",
          url: "/admin/financials/fees",
          icon: CreditCard,
        },
        {
          title: "Invoices",
          url: "/admin/financials/invoices",
          icon: FileText,
        },
        {
          title: "Payments",
          url: "/admin/financials/payments",
          icon: Receipt,
        },
        {
          title: "Payment Reconciliation",
          url: "/admin/financials/reconciliation",
          icon: DollarSign,
        },
        {
          title: "Expenses",
          url: "/admin/financials/expenses",
          icon: Wallet,
        },
        {
          title: "Payroll",
          url: "/admin/financials/payroll",
          icon: FileSignature,
        },
        {
          title: "Reports",
          url: "/admin/financials/reports",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Community",
      items: [
        {
          title: "Vehicles",
          url: "/admin/vehicles", 
          icon: Car,
        },
        {
          title: "Community Poll",
          url: "/admin/polls", 
          icon: Vote,
        },
        {
          title: "Complaints",
          url: "/admin/complaints", 
          icon: MessageSquareWarning,
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          title: "Document Templates",
          url: "/admin/templates",
          icon: FileArchive,
        },
        {
          title: "Letters",
          url: "/admin/letters",
          icon: Inbox,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          title: "Help Center",
          url: "/help-center",
          icon: HelpCircle,
        },
      ],
    },
  ],
};
