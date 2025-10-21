import {
  LayoutDashboard,
  Users,
  UserPlus,
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
  Settings,
  UserCog,
  Wrench,
  Palette,
  Bell,
  Monitor,
  HelpCircle,
  List,
  Sticker,
} from 'lucide-react'
import { type SidebarData } from '@/components/layout/types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin User',
    email: 'admin@hoa.com',
    avatar: '/avatars/admin.jpg',
  },
  navGroups: [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Users & Properties',
      items: [
        {
          title: 'Users',
          icon: Users,
          items: [
            {
              title: 'All Users',
              url: '/users',
              icon: List,
            },
            {
              title: 'Add User',
              url: '/users/add',
              icon: UserPlus,
            },
          ],
        },
        {
          title: 'Buildings',
          icon: Building,
          items: [
            {
              title: 'All Buildings',
              url: '/buildings',
              icon: List,
            },
            {
              title: 'Add Building',
              url: '/buildings/add',
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
              url: '/units',
              icon: List,
            },
            {
              title: 'Add Unit',
              url: '/units/add',
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
          url: '/financials/fees',
          icon: CreditCard,
        },
        {
          title: 'Invoices',
          url: '/financials/invoices',
          icon: FileText,
        },
        {
          title: 'Payments',
          url: '/financials/payments',
          icon: Receipt,
        },
        {
          title: 'Payment Reconciliation',
          url: '/financials/reconciliation',
          icon: DollarSign,
        },
        {
          title: 'Expenses',
          url: '/financials/expenses',
          icon: Wallet,
        },
        {
          title: 'Payroll',
          url: '/financials/payroll',
          icon: FileSignature,
        },
        {
          title: 'Reports',
          url: '/financials/reports',
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
              url: '/vehicles',
              icon: List,
            },
            {
              title: 'Add Vehicle',
              url: '/vehicles/add',
              icon: PlusCircle,
            },
            {
              title: 'Parking Stickers',
              url: '/vehicles/stickers',
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
              url: '/polls',
              icon: List,
            },
            {
              title: 'Create Poll',
              url: '/polls/create',
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
              url: '/complaints',
              icon: List,
            },
            {
              title: 'Create Complaint',
              url: '/complaints/create',
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
              url: '/letters',
              icon: List,
            },
            {
              title: 'Create Letter',
              url: '/letters/create',
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
