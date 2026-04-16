import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import type { Employee } from "@/types/types";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployeesAll,
  updateEmployee,
} from "@/features/admin/payroll/lib/payroll";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EMP_ROLES = [
  "maintenance",
  "security",
  "cleaning",
  "accountant",
  "secretary",
  "other",
] as const;
const EMP_TYPES = ["permanent", "contract", "hourly"] as const;

export function StaffDirectory() {
  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [fn, setFn] = useState("");
  const [ln, setLn] = useState("");
  const [role, setRole] = useState<string>("other");
  const [etype, setEtype] = useState<string>("permanent");
  const [salary, setSalary] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchEmployeesAll()
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createEmployee({
        first_name: fn,
        last_name: ln,
        role,
        employment_type: etype,
        gross_salary: parseFloat(salary) || 0,
      });
      toast.success("Employee added");
      setFn("");
      setLn("");
      load();
    } catch (err) {
      const er = err as ApiError;
      toast.error(
        (er.data as { message?: string })?.message ?? "Could not create"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground max-w-2xl">
        In-house staff records. <strong>Gross salary</strong> is used when generating monthly payroll runs.
      </p>

      <Card>
        <CardContent className="pt-6 grid gap-3">
          <p className="text-sm font-medium">Add employee</p>
          <form onSubmit={add} className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="First name" value={fn} onChange={(e) => setFn(e.target.value)} required />
              <Input placeholder="Last name" value={ln} onChange={(e) => setLn(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMP_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={etype} onValueChange={setEtype}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMP_TYPES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Gross salary (ETB / period)</Label>
              <Input
                placeholder="Gross salary"
                type="number"
                step="0.01"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? <Spinner className="h-4 w-4" /> : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-sm font-medium">Directory</p>
        {loading ? (
          <Spinner className="h-6 w-6" />
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {list.map((emp) => (
              <li
                key={emp.id}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <span>
                  {emp.full_name}{" "}
                  <span className="text-muted-foreground">({emp.role})</span>
                  <span className="text-muted-foreground ml-2">
                    gross {emp.gross_salary} ETB
                  </span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setEditing(emp)}>
                  Edit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
          {editing && (
            <EditEmployeeForm
              employee={editing}
              onDone={() => {
                setEditing(null);
                load();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditEmployeeForm({
  employee,
  onDone,
}: {
  employee: Employee;
  onDone: () => void;
}) {
  const [fn, setFn] = useState(employee.first_name);
  const [ln, setLn] = useState(employee.last_name);
  const [role, setRole] = useState(employee.role);
  const [etype, setEtype] = useState(employee.employment_type);
  const [salary, setSalary] = useState(String(employee.gross_salary));
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateEmployee(employee.id, {
        first_name: fn,
        last_name: ln,
        role,
        employment_type: etype,
        gross_salary: parseFloat(salary) || 0,
      });
      toast.success("Saved");
      onDone();
    } catch (err) {
      const er = err as ApiError;
      toast.error(
        (er.data as { message?: string })?.message ?? "Could not save"
      );
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    setBusy(true);
    try {
      await deleteEmployee(employee.id);
      toast.success("Employee removed");
      onDone();
    } catch (err) {
      const er = err as ApiError;
      toast.error(
        (er.data as { message?: string })?.message ?? "Could not delete"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Input value={fn} onChange={(e) => setFn(e.target.value)} />
        <Input value={ln} onChange={(e) => setLn(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMP_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={etype} onValueChange={setEtype}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMP_TYPES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="number"
        step="0.01"
        value={salary}
        onChange={(e) => setSalary(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="destructive" onClick={del} disabled={busy}>
          Delete
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4" /> : "Save"}
        </Button>
      </div>
    </form>
  );
}
