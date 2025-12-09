import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { fetchUsers } from "./lib/users";
import { columns } from "./components/columns";
import { DataTable } from "@/components/data-table/data-table";
import React, { useEffect, useState, useCallback } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useDebounce } from "use-debounce";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AddUserForm } from "./components/add-user-form";
import type { User } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { updateUserStatus } from "./lib/users";
import { EditUserForm } from "./components/edit-user-form";
import { ImportUsersDialog } from "./components/import-users-dialog";

export function Users() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchUsers(
      page.toString(),
      pagination.pageSize.toString(),
      debouncedSearch
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      setData((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );

      await updateUserStatus(userId, newStatus);

      toast.success(`User status updated to "${newStatus}"`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
      refreshUsers();
    }
  };

  const table = useReactTable({
    data: data,
    columns,
    pageCount,
    state: {
      pagination,
      rowSelection,
    },
    manualPagination: true,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    meta: {
      onStatusChange: handleStatusChange,
      setEditUser,
      setIsEditOpen,
    },
  });

  return (
    <>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User List</h2>
            <p className="text-muted-foreground">Manage system users here.</p>
          </div>

          {/* Right-side actions */}
          <div className="flex flex-wrap items-center gap-2">
            <ImportUsersDialog
              onSuccess={refreshUsers}
              templateUrl="/templates/users-import-template.xlsx"
            />

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <IconPlus className="h-4 w-4" />
                  Add User
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full sm:max-w-lg overflow-auto"
              >
                <SheetHeader>
                  <SheetTitle className="text-center">Add New User</SheetTitle>
                  <SheetDescription className="text-center">
                    Fill in the user information below to create a new account.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 pb-10">
                  <AddUserForm
                    onSuccess={() => {
                      setOpen(false);
                      refreshUsers();
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Edit sheet */}
          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">Edit User</SheetTitle>
                <SheetDescription className="text-center">
                  Update the user information below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                {editUser && (
                  <EditUserForm
                    user={editUser}
                    onSuccess={() => {
                      setIsEditOpen(false);
                      setEditUser(null);
                      refreshUsers();
                    }}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          {isLoading ? (
            <DataTableSkeleton
              columnCount={8}
              filterCount={1}
              cellWidths={[
                "6rem",
                "10rem",
                "30rem",
                "10rem",
                "10rem",
                "6rem",
                "6rem",
                "6rem",
              ]}
              shrinkZero
            />
          ) : (
            <DataTable table={table} onChange={setSearch} />
          )}
        </div>
      </Main>
    </>
  );
}
