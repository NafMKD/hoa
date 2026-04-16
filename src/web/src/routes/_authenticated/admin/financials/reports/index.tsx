import { createFileRoute } from "@tanstack/react-router";
import { Reports } from "@/features/admin/reports";

export const Route = createFileRoute("/_authenticated/admin/financials/reports/")({
  component: Reports,
});
