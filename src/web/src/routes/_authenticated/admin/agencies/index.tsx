import { createFileRoute } from "@tanstack/react-router";
import { AgenciesPage } from "@/features/admin/employees/agencies-page";

export const Route = createFileRoute("/_authenticated/admin/agencies/")({
  component: AgenciesPage,
});
