import { Main } from "@/components/layout/main";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardTabSkeleton } from "./components/dashboard-ui";
import { lazy, startTransition, Suspense, useMemo, useState } from "react";
import { Activity, BadgeDollarSign, LayoutDashboard, Users } from "lucide-react";

type DashboardTabKey = "overview" | "financials" | "community" | "operations";

const DashboardOverviewTab = lazy(
  () => import("./components/dashboard-overview-tab")
);
const DashboardFinancialsTab = lazy(
  () => import("./components/dashboard-financials-tab")
);
const DashboardCommunityTab = lazy(
  () => import("./components/dashboard-community-tab")
);
const DashboardOperationsTab = lazy(
  () => import("./components/dashboard-operations-tab")
);

const dashboardTabs: Array<{
  key: DashboardTabKey;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "financials", label: "Financials", icon: BadgeDollarSign },
  { key: "community", label: "Community", icon: Users },
  { key: "operations", label: "Operations", icon: Activity },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTabKey>("overview");

  const handleTabChange = (value: string) => {
    const nextTab = value as DashboardTabKey;

    startTransition(() => {
      setActiveTab(nextTab);
    });
  };

  const ActiveTabComponent = useMemo(() => {
    switch (activeTab) {
      case "financials":
        return DashboardFinancialsTab;
      case "community":
        return DashboardCommunityTab;
      case "operations":
        return DashboardOperationsTab;
      case "overview":
      default:
        return DashboardOverviewTab;
    }
  }, [activeTab]);

  return (
    <Main>
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">HOA Dashboard</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Day-to-day follow-up items
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max gap-1 rounded-xl p-1">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="gap-2 rounded-lg px-4 py-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      <div className="space-y-4">
        <Suspense fallback={<DashboardTabSkeleton />}>
          <ActiveTabComponent />
        </Suspense>
      </div>
    </Main>
  );
}
