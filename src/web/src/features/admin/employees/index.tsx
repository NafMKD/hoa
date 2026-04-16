import { Main } from "@/components/layout/main";
import { StaffDirectory } from "./staff-directory";

export function EmployeesPage() {
  return (
    <Main>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Employees</h2>
        <p className="text-muted-foreground">
          Manage employees and their gross salary used for payroll generation.
        </p>
      </div>
      <StaffDirectory />
    </Main>
  );
}
