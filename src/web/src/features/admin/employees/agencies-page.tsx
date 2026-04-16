import { Main } from "@/components/layout/main";
import { AgenciesTab } from "@/features/admin/payroll/agencies-tab";

export function AgenciesPage() {
  return (
    <Main>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Agencies</h2>
        <p className="text-muted-foreground">
          Staffing agencies, placements, and default monthly amounts used when generating
          agency payroll.
        </p>
      </div>
      <AgenciesTab />
    </Main>
  );
}
