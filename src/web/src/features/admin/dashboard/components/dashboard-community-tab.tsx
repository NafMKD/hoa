import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardCardFrame, DashboardEmptyState, DashboardErrorState, DashboardMetricCard, DashboardTabSkeleton } from "./dashboard-ui";
import { useDashboardTabData } from "./use-dashboard-tab-data";
import {
  communityDashboardQueryOptions,
  formatCompactNumber,
  formatDateTime,
  isSampled,
  titleCaseLabel,
} from "../lib/dashboard";
import { reportChartFill } from "@/features/admin/reports/lib/chart-colors";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function DashboardCommunityTab() {
  const { data, isLoading, error, reload } = useDashboardTabData(
    communityDashboardQueryOptions()
  );

  const roleMix = useMemo(() => {
    if (!data) return [];

    const roles = ["homeowner", "tenant", "representative", "admin", "accountant", "secretary"];

    return roles
      .map((role) => ({
        name: titleCaseLabel(role),
        value: data.users.data.filter((user) => user.role === role).length,
      }))
      .filter((role) => role.value > 0);
  }, [data]);

  const unitStatusMix = useMemo(() => {
    if (!data) return [];

    const counts = new Map<string, number>();
    for (const unit of data.units.data) {
      const label = titleCaseLabel(unit.status_name || unit.status);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (isLoading) {
    return <DashboardTabSkeleton />;
  }

  if (error || !data) {
    return (
      <DashboardErrorState
        title="Could not load the community view"
        message={error ?? "The community view is unavailable right now."}
        onRetry={reload}
      />
    );
  }

  const usersSampled = isSampled(data.users.meta.total, data.users.data.length);
  const unitsSampled = isSampled(data.units.meta.total, data.units.data.length);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Users"
          value={formatCompactNumber(data.users.meta.total)}
          description="People profiles across residents and staff"
          tone="sky"
        />
        <DashboardMetricCard
          title="Buildings"
          value={formatCompactNumber(data.buildings.meta.total)}
          description="Managed building records"
          tone="gold"
        />
        <DashboardMetricCard
          title="Units"
          value={formatCompactNumber(data.units.meta.total)}
          description="Residential and commercial spaces"
          tone="teal"
        />
        <DashboardMetricCard
          title="Vehicles"
          value={formatCompactNumber(data.vehicles.meta.total)}
          description="Registered vehicles and parking records"
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <DashboardCardFrame
          title="Role mix"
          description={
            usersSampled
              ? `Based on the first ${data.users.data.length} users returned by the API.`
              : "Current distribution of user roles in the system."
          }
          className="lg:col-span-3"
        >
          {roleMix.length === 0 ? (
            <DashboardEmptyState
              title="No user roles to visualize"
              description="Role distribution will appear here once people are registered."
            />
          ) : (
            <div className="space-y-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {roleMix.map((role, index) => (
                        <Cell key={role.name} fill={reportChartFill(index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => formatCompactNumber(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {roleMix.map((role, index) => (
                  <div
                    key={role.name}
                    className="flex items-center justify-between rounded-xl border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: reportChartFill(index) }}
                      />
                      <span className="text-sm">{role.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCompactNumber(role.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCardFrame>

        <DashboardCardFrame
          title="Unit status"
          description={
            unitsSampled
              ? `Based on the first ${data.units.data.length} units returned by the API.`
              : "Current mix of unit statuses."
          }
          className="lg:col-span-4"
        >
          {unitStatusMix.length === 0 ? (
            <DashboardEmptyState
              title="No units available"
              description="Once units are created, status distribution will show up here."
            />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitStatusMix} margin={{ top: 12, right: 8, left: -12 }}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip formatter={(value: number | string) => formatCompactNumber(Number(value))} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {unitStatusMix.map((status, index) => (
                      <Cell key={status.name} fill={reportChartFill(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCardFrame>
      </div>

      <DashboardCardFrame
        title="Newest users"
        description="Recently added people records"
      >
        {data.recentUsers.length === 0 ? (
          <DashboardEmptyState
            title="No users yet"
            description="Newly created users will appear here once the directory starts growing."
          />
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          to="/admin/users/$userId"
                          params={{ userId: String(user.id) }}
                          className="font-medium text-primary hover:underline"
                        >
                          {user.full_name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {user.phone ?? user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{titleCaseLabel(user.role)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.status === "active" ? "secondary" : "outline"}
                        className="capitalize"
                      >
                        {titleCaseLabel(user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(user.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DashboardCardFrame>
    </div>
  );
}
