import { createFileRoute } from "@tanstack/react-router";
import { Payroll } from "@/features/admin/payroll";

export const Route = createFileRoute("/_authenticated/admin/financials/payroll/")({
  component: Payroll,
});
