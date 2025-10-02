import { AppSidebar } from "@/admin/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

export default function AdminLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode;
  breadcrumb?: React.ReactNode;
}) {
  const navigate = useNavigate();
  const resetAuth = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await api.post("/auth/logout");

      // Clear local auth state
      resetAuth();

      // Redirect to login page
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally show a toast notification
    }
  };
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1 cursor-pointer" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />

            {breadcrumb && breadcrumb}

            <div className="flex-grow"></div>
            <ModeToggle />
            <Button
              variant="outline"
              className="ml-4 hidden sm:flex dark:text-foreground"
              onClick={handleLogout}
            >
              <LogOut />
              Log out
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
