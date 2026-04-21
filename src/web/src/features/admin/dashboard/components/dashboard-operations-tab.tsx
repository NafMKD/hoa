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
  formatCompactNumber,
  formatDateTime,
  hasAnyCounts,
  operationsDashboardQueryOptions,
  titleCaseLabel,
} from "../lib/dashboard";
import { reportChartFill } from "@/features/admin/reports/lib/chart-colors";
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

function complaintStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "open":
      return "destructive";
    case "in_progress":
      return "default";
    case "resolved":
      return "secondary";
    default:
      return "outline";
  }
}

function complaintPriorityVariant(
  priority: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "urgent":
    case "high":
      return "destructive";
    case "normal":
      return "default";
    default:
      return "secondary";
  }
}

export default function DashboardOperationsTab() {
  const { data, isLoading, error, reload } = useDashboardTabData(
    operationsDashboardQueryOptions()
  );

  if (isLoading) {
    return <DashboardTabSkeleton />;
  }

  if (error || !data) {
    return (
      <DashboardErrorState
        title="Could not load the operations view"
        message={error ?? "The operations view is unavailable right now."}
        onRetry={reload}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Open complaints"
          value={formatCompactNumber(data.openComplaints)}
          description={`${formatCompactNumber(
            data.totalComplaints
          )} total complaints in the system`}
          tone="rose"
        />
        <DashboardMetricCard
          title="In progress"
          value={formatCompactNumber(data.inProgressComplaints)}
          description={`${formatCompactNumber(
            data.resolvedComplaints + data.closedComplaints
          )} already resolved or closed`}
          tone="sky"
        />
        <DashboardMetricCard
          title="Open polls"
          value={formatCompactNumber(data.openPolls)}
          description="Currently accepting votes"
          tone="teal"
        />
        <DashboardMetricCard
          title="Draft polls"
          value={formatCompactNumber(data.draftPolls)}
          description={`${formatCompactNumber(
            data.closedPolls
          )} already completed`}
          tone="violet"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <DashboardCardFrame
          title="Complaint status"
          description="How resident issues are moving through the queue"
          className="lg:col-span-4"
        >
          {!hasAnyCounts(data.complaintStatusCounts) ? (
            <DashboardEmptyState
              title="No complaints to visualize"
              description="Complaint activity will show up here as soon as issues are reported."
            />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.complaintStatusCounts} margin={{ top: 12, right: 8, left: -12 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => formatCompactNumber(Number(value))}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip formatter={(value: number | string) => formatCompactNumber(Number(value))} />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                    {data.complaintStatusCounts.map((status, index) => (
                      <Cell key={status.key} fill={reportChartFill(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DashboardCardFrame>

        <DashboardCardFrame
          title="Poll status"
          description="Draft, open, and closed community polls"
          className="lg:col-span-3"
        >
          {!hasAnyCounts(data.pollStatusCounts) ? (
            <DashboardEmptyState
              title="No polls yet"
              description="Once polls are created, their current status mix will appear here."
            />
          ) : (
            <div className="space-y-4">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.pollStatusCounts}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={54}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {data.pollStatusCounts.map((status, index) => (
                        <Cell key={status.key} fill={reportChartFill(index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | string) => formatCompactNumber(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {data.pollStatusCounts.map((status, index) => (
                  <div
                    key={status.key}
                    className="flex items-center justify-between rounded-xl border px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: reportChartFill(index) }}
                      />
                      <span className="text-sm">{status.label}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCompactNumber(status.count)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardCardFrame>
      </div>

      <DashboardCardFrame
        title="Recent complaints"
        description="Newest issues submitted by residents"
      >
        {data.recentComplaints.length === 0 ? (
          <DashboardEmptyState
            title="No complaint activity yet"
            description="Recent resident issues will appear here once complaints start being submitted."
          />
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{complaint.subject}</span>
                        <span className="text-xs text-muted-foreground">
                          {complaint.submitter?.full_name ?? `User #${complaint.user_id}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{titleCaseLabel(complaint.category)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={complaintStatusVariant(complaint.status)}
                        className="capitalize"
                      >
                        {titleCaseLabel(complaint.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={complaintPriorityVariant(complaint.priority)}
                        className="capitalize"
                      >
                        {titleCaseLabel(complaint.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDateTime(complaint.created_at)}
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
