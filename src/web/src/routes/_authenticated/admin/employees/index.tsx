import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "@/features/admin/employees";

export const Route = createFileRoute("/_authenticated/admin/employees/")({
  component: EmployeesPage,
});
