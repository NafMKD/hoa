import { createFileRoute } from "@tanstack/react-router";
import { PayrollRulesPage } from "@/features/admin/employees/payroll-rules";

export const Route = createFileRoute("/_authenticated/admin/payroll-rules/")({
  component: PayrollRulesPage,
});
