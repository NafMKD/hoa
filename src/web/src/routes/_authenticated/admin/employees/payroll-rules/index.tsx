import { createFileRoute } from "@tanstack/react-router";
import { PayrollRulesPage } from "@/features/admin/employees/payroll-rules";

export const Route = createFileRoute("/_authenticated/admin/employees/payroll-rules/")({
  component: PayrollRulesPage,
});
