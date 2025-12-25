import { RecentPaymentsTable, type Payment } from './components/recent-payments-table'
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
import { cn } from "@/lib/utils"

// === Fake Data ===
const incomeExpenseData = [
  { month: 'Jan', income: 12000, expenses: 7000 },
  { month: 'Feb', income: 15000, expenses: 9000 },
  { month: 'Mar', income: 11000, expenses: 8500 },
  { month: 'Apr', income: 18000, expenses: 9500 },
  { month: 'May', income: 16000, expenses: 10000 },
  { month: 'Jun', income: 20000, expenses: 11000 },
]

type SummaryVariant = "gold" | "blue" | "teal" | "violet"

const styles: Record<
  SummaryVariant,
  {
    card: string
    title: string
    muted: string
    value: string
    pos: string
    neg: string
  }
> = {
  gold: {
    card: "bg-gradient-to-br from-[#FFF1B8] to-[#D4AF37] shadow-sm",
    title: "text-[#1A1300]/80",
    muted: "text-[#1A1300]/60",
    value: "text-[#1A1300]",
    pos: "text-emerald-700",
    neg: "text-rose-700",
  },
  blue: {
    card: "bg-gradient-to-br from-[#60A5FA] to-[#1D4ED8] shadow-sm",
    title: "text-white/85",
    muted: "text-white/70",
    value: "text-white",
    pos: "text-emerald-100",
    neg: "text-rose-100",
  },
  teal: {
    card: "bg-gradient-to-br from-[#5EEAD4] to-[#14B8A6] shadow-sm",
    title: "text-[#062B2A]/80",
    muted: "text-[#062B2A]/60",
    value: "text-[#062B2A]",
    pos: "text-emerald-700",
    neg: "text-rose-700",
  },
  violet: {
    card: "bg-gradient-to-br from-[#E9D5FF] to-[#A855F7] shadow-sm",
    title: "text-[#1B0830]/80",
    muted: "text-[#1B0830]/60",
    value: "text-[#1B0830]",
    pos: "text-emerald-700",
    neg: "text-rose-700",
  },
}

export function Dashboard() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className="mb-2 flex items-center justify-between space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">HOA Dashboard</h1>
        </div>

        <Tabs
          orientation="vertical"
          defaultValue="overview"
          className="space-y-4"
        >
          <div className="w-full overflow-x-auto pb-2">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="residents">Residents</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>

          {/* ==== OVERVIEW ==== */}
          <TabsContent value="overview" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Total Dues Collected"
                value="$85,430"
                change="+12.3%"
                variant="gold"
              />
              <SummaryCard
                title="Pending Payments"
                value="$4,850"
                change="-3.8%"
                variant="violet"
              />
              <SummaryCard
                title="Active Residents"
                value="142"
                change="+8 new"
                variant="teal"
              />
              <SummaryCard
                title="Open Maintenance Requests"
                value="9"
                change="+2 new"
                variant="blue"
              />
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              {/* Chart */}
              <Card
                className={cn(
                  "col-span-1 lg:col-span-4 rounded-2xl border-0 overflow-hidden",
                  "ring-1 ring-black/5",
                  "bg-gradient-to-br from-[#FFF7D6] via-[color:color-mix(in_oklab,#D4AF37_18%,white)] to-[#FFE9A3]"
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-[#1A1300]">
                    Income vs Expenses
                  </CardTitle>
                  <p className="text-sm text-[#1A1300]/60">
                    Monthly comparison of cash flow
                  </p>
                </CardHeader>

                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeExpenseData}>
                      <XAxis dataKey="month" stroke="rgba(26,19,0,0.55)" />
                      <YAxis stroke="rgba(26,19,0,0.55)" />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.9)",
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 12,
                        }}
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      />
                      <Bar
                        dataKey="income"
                        name="Income"
                        radius={[10, 10, 0, 0]}
                        fill="#14B8A6" /* teal (matches your accent) */
                      />
                      <Bar
                        dataKey="expenses"
                        name="Expenses"
                        radius={[10, 10, 0, 0]}
                        fill="#EF4444" /* red (destructive) */
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <RecentPaymentsTable data={recentPayments} />
            </div>
          </TabsContent>

          {/* ==== RESIDENTS ==== */}
          <TabsContent value="residents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Residents List</CardTitle>
                <CardDescription>
                  Manage all registered homeowners
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* integrate your TanStack Table here */}
                <div className="text-muted-foreground text-sm">
                  Table placeholder for Residents
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==== MAINTENANCE ==== */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ongoing Maintenance</CardTitle>
                <CardDescription>
                  Track ongoing repair and cleaning tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {maintenance.map((m, i) => (
                  <div
                    key={i}
                    className="flex justify-between border-b py-2 text-sm"
                  >
                    <span>{m.task}</span>
                    <span
                      className={`${
                        m.status === "In Progress"
                          ? "text-yellow-600"
                          : m.status === "Completed"
                            ? "text-green-600"
                            : "text-red-600"
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
  );
}

// === Sub Components ===
function SummaryCard({
  title,
  value,
  change,
  variant = "gold",
}: {
  title: string
  value: string
  change: string
  variant?: SummaryVariant
}) {
  const isNegative = change.trim().startsWith("-")
  const s = styles[variant]

  return (
    <Card
      className={cn(
        "rounded-2xl border-0 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md",
        "overflow-hidden",
        s.card
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", s.title)}>{title}</CardTitle>
      </CardHeader>

      <CardContent>
        <div className={cn("text-2xl font-bold tracking-tight", s.value)}>{value}</div>

        <p className={cn("text-xs", isNegative ? s.neg : s.pos)}>
          {change} <span className={s.muted}>from last month</span>
        </p>
      </CardContent>
    </Card>
  )
}


// === Fake Data Sets ===
const recentPayments: Payment[] = [
  { name: 'John Doe', amount: 120, status: 'Paid', date: '2024-06-10' },
  { name: 'Jane Smith', amount: 85, status: 'Pending', date: '2024-06-09' },
  { name: 'Villa 09', amount: 100, status: 'Paid', date: '2024-06-08' },
  { name: 'Apartment 24', amount: 95, status: 'Pending', date: '2024-06-07' },
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
