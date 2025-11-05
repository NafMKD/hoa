import { Link } from "@tanstack/react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppTitle() {
  const { open, setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="gap-2 py-0 hover:bg-transparent active:bg-transparent flex items-center"
          asChild
        >
          <div className="flex items-center">
            <Avatar>
              <AvatarFallback>NG</AvatarFallback>
            </Avatar>

            {open && (
              <Link
                to="/admin"
                onClick={() => setOpenMobile(false)}
                className="grid flex-1 text-start text-sm leading-tight ml-2"
              >
                <span className="truncate font-bold">Noah Garden HOA</span>
                <span className="truncate text-xs">Admin Dashboard</span>
              </Link>
            )}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
