import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface DashboardProps {
  setBreadcrumb: (breadcrumb: React.ReactNode) => void;
}

export default function AddUser({ setBreadcrumb }: DashboardProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    role: "homeowner",
  });

  const roles = ["admin", "accountant", "secretary", "homeowner", "tenant"];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submitted:", form);
    alert("User added successfully! (Demo)");
    setForm({ name: "", phone: "", email: "", role: "homeowner" });
  };

  return (
    <Card className="bg-muted/50 rounded-xl max-w-4xl mx-auto p-8">
      <CardHeader className="mb-6">
        <CardTitle className="text-3xl font-bold">Add New User</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
          onSubmit={handleSubmit}
        >
          <div className="col-span-1">
            <Label htmlFor="name" className="text-lg font-medium mb-2 block">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="h-12"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor="phone" className="text-lg font-medium mb-2 block">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="0912345678"
              className="h-12"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor="email" className="text-lg font-medium mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className="h-12"
            />
          </div>

          <div className="col-span-1">
            <Label htmlFor="role" className="text-lg font-medium mb-2 block">
              Role
            </Label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 md:col-span-2 mt-4">
            <Button type="submit" className="w-full h-12 text-lg">
              Add User
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
