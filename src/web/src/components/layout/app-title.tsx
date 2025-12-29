import { Link } from "@tanstack/react-router";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
            <Avatar className={`${open ? 'h-10 w-10' : 'h-8 w-8'}`}>
              <AvatarImage
                src="/images/logo.png"
                alt="Noah Garden HOA"
              />
              <AvatarFallback>NG</AvatarFallback>
            </Avatar>

            {open && (
              <Link
                to="/admin"
                onClick={() => setOpenMobile(false)}
                className="grid flex-1 text-start text-sm leading-tight"
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
