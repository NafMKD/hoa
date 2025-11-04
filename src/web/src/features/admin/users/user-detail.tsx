import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUserDetail } from "./lib/users";
import type { User } from "@/types/user";
import { Link, useParams } from "@tanstack/react-router";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { IconArrowLeft, IconArrowLeftCircle } from "@tabler/icons-react";

export function UserDetail() {
  const { userId } = useParams({ from: "/_authenticated/admin/users/$userId" });
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await fetchUserDetail(userId as string);
        setUser(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  if (isLoading) {
    return (
      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-20" />
        </div>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-md" />
            ))}
          </div>

          <div className="space-y-6">
            <Skeleton className="h-5 w-32" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-muted">
                  <CardHeader>
                    <Skeleton className="h-5 w-40" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Main>
    );
  }

  if (!user) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">User not found.</p>
          <Button asChild>
            <Link to="/admin/users">
              .
              <IconArrowLeftCircle size={16} className="mr-1" />
              Back to Users
            </Link>
          </Button>
        </div>
      </Main>
    );
  }

  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let className: string = "";

  if (user.status === "active") {
    variant = "secondary";
    className = "bg-green-100 text-green-800";
  } else if (user.status === "inactive") {
    variant = "secondary";
    className="bg-yellow-100 text-yellow-800";
  } else if (user.status === "suspended") {
    variant = "destructive";
  }
  
  return (
    <>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
          <Button variant="outline" asChild>
            <Link to="/admin/users">
              <IconArrowLeft size={16} className="mr-1" />
              Back
            </Link>
          </Button>
        </div>

        <Card className="shadow-sm border-muted">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {user.first_name} {user.last_name}
              </CardTitle>
              <Badge variant={variant} className={className}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
            </div>
            <CardDescription className="text-muted-foreground">
              Basic account information and metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{user.role || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Login</p>
              <p className="font-medium">{user.last_login_at || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">{user.created_at || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Updated At</p>
              <p className="font-medium">{user.updated_at || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="units" className="w-full">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="leases">Leases</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="payments" disabled>
              Payments (Coming Soon)
            </TabsTrigger>
            <TabsTrigger value="invoices" disabled>
              Invoices (Coming Soon)
            </TabsTrigger>
            <TabsTrigger value="expenses" disabled>
              Expenses (Coming Soon)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-6 space-y-8">
            <section>
              <h2 className="text-lg font-semibold mb-3">Owned Units</h2>
              {user.owned_units?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user.owned_units.map((unit) => (
                    <Card key={unit.id} className="hover:shadow transition">
                      <CardHeader>
                        <CardTitle>{unit.name || `Unit #${unit.id}`}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {unit.description || "No description"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No owned units.</p>
              )}
            </section>

            <Separator />

            <section>
              <h2 className="text-lg font-semibold mb-3">Rented Units</h2>
              {user.rented_units?.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user.rented_units.map((unit) => (
                    <Card key={unit.id} className="hover:shadow transition">
                      <CardHeader>
                        <CardTitle>{unit.name || `Unit #${unit.id}`}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {unit.description || "No description"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No rented units.
                </p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="leases" className="mt-6 space-y-4">
            {user.leases?.length ? (
              user.leases.map((lease) => (
                <Card key={lease.id} className="hover:shadow transition">
                  <CardHeader>
                    <CardTitle>{lease.title || `Lease #${lease.id}`}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {lease.description || "No details available"}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No leases found.</p>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-6 space-y-8">
            {user.created_templates?.length ||
            user.updated_templates?.length ? (
              <>
                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Created Templates
                  </h2>
                  {user.created_templates?.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {user.created_templates.map((tpl) => (
                        <Card key={tpl.id} className="hover:shadow transition">
                          <CardHeader>
                            <CardTitle>{tpl.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">
                              {tpl.description || "No description"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">None</p>
                  )}
                </section>

                <Separator />

                <section>
                  <h2 className="text-lg font-semibold mb-3">
                    Updated Templates
                  </h2>
                  {user.updated_templates?.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {user.updated_templates.map((tpl) => (
                        <Card key={tpl.id} className="hover:shadow transition">
                          <CardHeader>
                            <CardTitle>{tpl.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground">
                              {tpl.description || "No description"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">None</p>
                  )}
                </section>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No templates yet.</p>
            )}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
