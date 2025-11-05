import { RecentPaymentsTable } from './components/recent-payments-table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/admin/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// === Fake Data ===
const incomeExpenseData = [
  { month: 'Jan', income: 12000, expenses: 7000 },
  { month: 'Feb', income: 15000, expenses: 9000 },
  { month: 'Mar', income: 11000, expenses: 8500 },
  { month: 'Apr', income: 18000, expenses: 9500 },
  { month: 'May', income: 16000, expenses: 10000 },
  { month: 'Jun', income: 20000, expenses: 11000 },
]

export function Dashboard() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>HOA Dashboard</h1>
        </div>

        <Tabs orientation='vertical' defaultValue='overview' className='space-y-4'>
          <div className='w-full overflow-x-auto pb-2'>
            <TabsList>
              <TabsTrigger value='overview'>Overview</TabsTrigger>
              <TabsTrigger value='residents'>Residents</TabsTrigger>
              <TabsTrigger value='maintenance'>Maintenance</TabsTrigger>
              <TabsTrigger value='reports'>Reports</TabsTrigger>
            </TabsList>
          </div>

          {/* ==== OVERVIEW ==== */}
          <TabsContent value='overview' className='space-y-4'>
            {/* Summary Cards */}
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <SummaryCard title='Total Dues Collected' value='$85,430' change='+12.3%' />
              <SummaryCard title='Pending Payments' value='$4,850' change='-3.8%' />
              <SummaryCard title='Active Residents' value='142' change='+8 new' />
              <SummaryCard title='Open Maintenance Requests' value='9' change='+2 new' />
            </div>

            {/* Charts and Tables */}
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              {/* Chart */}
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent className='h-[280px]'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={incomeExpenseData}>
                      <XAxis dataKey='month' />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey='income' fill='#4ade80' name='Income' />
                      <Bar dataKey='expenses' fill='#f87171' name='Expenses' />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <RecentPaymentsTable data={recentPayments} />
            </div>
          </TabsContent>

          {/* ==== RESIDENTS ==== */}
          <TabsContent value='residents' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Residents List</CardTitle>
                <CardDescription>Manage all registered homeowners</CardDescription>
              </CardHeader>
              <CardContent>
                {/* integrate your TanStack Table here */}
                <div className='text-muted-foreground text-sm'>
                  Table placeholder for Residents
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==== MAINTENANCE ==== */}
          <TabsContent value='maintenance' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Ongoing Maintenance</CardTitle>
                <CardDescription>Track ongoing repair and cleaning tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {maintenance.map((m, i) => (
                  <div key={i} className='flex justify-between border-b py-2 text-sm'>
                    <span>{m.task}</span>
                    <span
                      className={`${
                        m.status === 'In Progress'
                          ? 'text-yellow-600'
                          : m.status === 'Completed'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

// === Sub Components ===
function SummaryCard({ title, value, change }) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-muted-foreground text-xs'>{change} from last month</p>
      </CardContent>
    </Card>
  )
}

// === Fake Data Sets ===
const recentPayments = [
  { name: 'John Doe', amount: '$120', status: 'Paid', date: '2024-06-10' },
  { name: 'Jane Smith', amount: '$85', status: 'Pending', date: '2024-06-09' },
  { name: 'Villa 09', amount: '$100', status: 'Paid', date: '2024-06-08' },
  { name: 'Apartment 24', amount: '$95', status: 'Overdue', date: '2024-06-07' },
]

const maintenance = [
  { task: 'Street light repair', status: 'In Progress' },
  { task: 'Pool cleaning', status: 'Completed' },
  { task: 'Security camera upgrade', status: 'Pending' },
]

const topNav = [
  { title: 'Financials', href: '/admin/financials', isActive: true, disabled: false },
  { title: 'Residents', href: '/admin/residents', isActive: false, disabled: false },
  { title: 'Maintenance', href: '/admin/maintenance', isActive: false, disabled: false },
]
