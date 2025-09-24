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

export default function AdminLayout({ children, breadcrumb }: { children: React.ReactNode, breadcrumb?: React.ReactNode }) {
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
            <ModeToggle/>
            <Button variant="outline" className="ml-4 hidden sm:flex dark:text-foreground">
              <LogOut />
              Log out
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">

          {children}
          
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
