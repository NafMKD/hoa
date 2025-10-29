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
  PlusCircle,
  Vote,
  Inbox,
  FileSignature,
  MessageSquareWarning,
  HelpCircle,
  List,
  Sticker,
} from 'lucide-react'
import { type SidebarData } from '@/components/layout/types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin User',
    email: 'admin@gmail.com',
    avatar: '/avatars/admin.jpg',
  },
  navGroups: [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Users & Properties',
      items: [
        {
          title: 'Users',
          url: '/admin/users',
          icon: Users,
        },
        {
          title: 'Buildings',
          icon: Building,
          items: [
            {
              title: 'All Buildings',
              url: '/admin/buildings',
              icon: List,
            },
            {
              title: 'Add Building',
              url: '/admin/buildings/add',
              icon: PlusCircle,
            },
          ],
        },
        {
          title: 'Units',
          icon: Home,
          items: [
            {
              title: 'All Units',
              url: '/admin/units',
              icon: List,
            },
            {
              title: 'Add Unit',
              url: '/admin/units/add',
              icon: PlusCircle,
            },
          ],
        },
      ],
    },
    {
      title: 'Financials',
      items: [
        {
          title: 'Fees',
          url: '/admin/financials/fees',
          icon: CreditCard,
        },
        {
          title: 'Invoices',
          url: '/admin/financials/invoices',
          icon: FileText,
        },
        {
          title: 'Payments',
          url: '/admin/financials/payments',
          icon: Receipt,
        },
        {
          title: 'Payment Reconciliation',
          url: '/admin/financials/reconciliation',
          icon: DollarSign,
        },
        {
          title: 'Expenses',
          url: '/admin/financials/expenses',
          icon: Wallet,
        },
        {
          title: 'Payroll',
          url: '/admin/financials/payroll',
          icon: FileSignature,
        },
        {
          title: 'Reports',
          url: '/admin/financials/reports',
          icon: BarChart3,
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          title: 'Vehicles',
          icon: Car,
          items: [
            {
              title: 'All Vehicles',
              url: '/admin/vehicles',
              icon: List,
            },
            {
              title: 'Add Vehicle',
              url: '/admin/vehicles/add',
              icon: PlusCircle,
            },
            {
              title: 'Parking Stickers',
              url: '/admin/vehicles/stickers',
              icon: Sticker,
            },
          ],
        },
        {
          title: 'Community Poll',
          icon: Vote,
          items: [
            {
              title: 'All Polls',
              url: '/admin/polls',
              icon: List,
            },
            {
              title: 'Create Poll',
              url: '/admin/polls/create',
              icon: PlusCircle,
            },
          ],
        },
        {
          title: 'Complaints',
          icon: MessageSquareWarning,
          items: [
            {
              title: 'All Complaints',
              url: '/admin/complaints',
              icon: List,
            },
            {
              title: 'Create Complaint',
              url: '/admin/complaints/create',
              icon: PlusCircle,
            },
          ],
        },
        {
          title: 'Letters',
          icon: Inbox,
          items: [
            {
              title: 'All Letters',
              url: '/admin/letters',
              icon: List,
            },
            {
              title: 'Create Letter',
              url: '/admin/letters/create',
              icon: PlusCircle,
            },
          ],
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Help Center',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
