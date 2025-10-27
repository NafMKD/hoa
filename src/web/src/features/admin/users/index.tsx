import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { fetchUsers } from "./lib/users";
import { columns } from "./data-table/columns";
import { DataTable } from "./data-table/data-table";
import { useQuery } from "@tanstack/react-query";


export function Users() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
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
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User List</h2>
            <p className="text-muted-foreground">Manage system users here.</p>
          </div>
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <DataTable columns={columns} data={data} />
        </div>
      </Main>
    </>
  );
}
