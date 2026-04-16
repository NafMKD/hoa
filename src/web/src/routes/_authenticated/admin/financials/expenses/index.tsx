import { createFileRoute } from "@tanstack/react-router";
import { Expenses } from "@/features/admin/expenses";

export const Route = createFileRoute("/_authenticated/admin/financials/expenses/")({
  component: Expenses,
});
