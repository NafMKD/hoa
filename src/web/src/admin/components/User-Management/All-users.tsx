import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, User, Shield, UserCheck, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardProps {
    setBreadcrumb: (breadcrumb: React.ReactNode) => void;
  }
  
export default function AllUsers({ setBreadcrumb }: DashboardProps) {
  const users = [
    { username: "freeman.dicki", name: "Freeman Dicki", email: "freeman83@gmail.com", phone: "0972759140",  role: "Accountant" },
    { username: "nick.bashirian-lowe", name: "Nick Bashirian-Lowe", email: "nick_donnelly@gmail.com", phone: "0925632370",  role: "Admin" },
    { username: "ardith_jast", name: "Ardith Jast", email: "ardith_crist@gmail.com", phone: "0953118532", role: "Secretary" },
    // ... add more
  ];

  const getRoleIcon = (role: string) => {
    switch(role) {
      case "Admin": return <UserCheck className="w-4 h-4" />;
      case "Accountant": return <User className="w-4 h-4" />;
      case "Secretary": return <Shield className="w-4 h-4" />;
      case "user": return <UserPlus className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">User List</h2>
          <p className="text-sm text-muted-foreground">Manage your users and their roles here.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            Export
          </Button>
          <Button variant="default" className="flex items-center gap-2">
            <Link to="/admin/users/add">
            Add User
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input placeholder="Filter users..." className="flex-1" />
        <Button variant="outline">Status</Button>
        <Button variant="outline">Role</Button>
        <Button variant="outline">View</Button>
      </div>

      <Table className="bg-card border border-border rounded-lg overflow-hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input type="checkbox" className="rounded border-gray-300" />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Role</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.username}>
              <TableCell><input type="checkbox" className="rounded border-gray-300" /></TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell className="flex items-center gap-2">
                {getRoleIcon(user.role)} {user.role}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <select className="border rounded px-2 py-1 text-sm">
            <option>10 Rows per page</option>
            <option>25 Rows per page</option>
            <option>50 Rows per page</option>
          </select>
        </div>
        <div className="flex gap-1 text-sm">
          <Button variant="outline" size="sm">{'<<'}</Button>
          <Button variant="outline" size="sm">{'<'}</Button>
          <Button variant="default" size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <span className="px-2 py-1">...</span>
          <Button variant="outline" size="sm">50</Button>
          <Button variant="outline" size="sm">{'>'}</Button>
          <Button variant="outline" size="sm">{'>>'}</Button>
        </div>
      </div>
    </div>
  );
}
