import { Main } from "@/components/layout/main";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DirectPayrollTab } from "./direct-payroll-tab";
import { AgencyMonthlyTab } from "./agency-monthly-tab";

export function Payroll() {
  return (
    <Main>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Payroll</h2>
        <p className="text-muted-foreground">
          Generate and approve direct employee payroll and agency monthly payouts. Employee
          records and agencies are under Employees in the sidebar.
        </p>
      </div>

      <Tabs defaultValue="direct" className="gap-6">
        <TabsList>
          <TabsTrigger value="direct">Direct payroll</TabsTrigger>
          <TabsTrigger value="monthly">Agency monthly</TabsTrigger>
        </TabsList>
        <TabsContent value="direct">
          <DirectPayrollTab />
        </TabsContent>
        <TabsContent value="monthly">
          <AgencyMonthlyTab />
        </TabsContent>
      </Tabs>
    </Main>
  );
}
