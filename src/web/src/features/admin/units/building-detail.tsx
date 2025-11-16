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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUnitDetail } from "./lib/units";
import type { Unit } from "@/types/types";
import { Link, useParams } from "@tanstack/react-router";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { IconArrowLeft, IconArrowLeftCircle } from "@tabler/icons-react";

export function UnitDetail() {
  const { unitId } = useParams({ from: "/_authenticated/admin/units/$unitId" });
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUnit = async () => {
      try {
        const data = await fetchUnitDetail(unitId as string);
        setUnit(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadUnit();
  }, [unitId]);

  if (isLoading) {
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
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-9 w-20" />
          </div>

          <Card className="border-muted shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-60" />
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
        </Main>
      </>
    );
  }

  if (!unit) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">Unit not found.</p>
          <Button asChild>
            <Link to="/admin/units">
              <IconArrowLeftCircle size={16} className="mr-1" />
              Back to Units
            </Link>
          </Button>
        </div>
      </Main>
    );
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
          <h1 className="text-2xl font-bold tracking-tight">Unit Details</h1>
          <Button variant="outline" asChild>
            <Link to="/admin/units">
              <IconArrowLeft size={16} className="mr-1" />
              Back
            </Link>
          </Button>
        </div>

        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Unit - {unit.name || `#${unit.id}`}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Basic unit information
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Building</p>
              <p className="font-medium">
                { unit.building ? (
                  <Link
                    to="/admin/buildings/$buildingId"
                    params={{ buildingId: unit.building.id as string }}
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    {unit.building.name}
                  </Link>
                ) : (
                  "—"
                )
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Floor Number</p>
              <p className="font-medium">{unit.floor_number ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unit Type</p>
              <p className="font-medium">{unit.type_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Size (m²)</p>
              <p className="font-medium">{unit.size_m2 || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{unit.status || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">{unit.created_at || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Updated At</p>
              <p className="font-medium">{unit.updated_at || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="relationships" className="w-full">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
            <TabsTrigger value="ownership">Ownership</TabsTrigger>
            <TabsTrigger value="leases">Leases</TabsTrigger>
          </TabsList>

          <TabsContent value="relationships" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>People Related</CardTitle>
                <CardDescription>Owner and tenant details</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium">
                    {unit.owner ? `${unit.owner.first_name} ${unit.owner.last_name}`   : "—"}
                  </p>
                </div>
                {unit.tenant && (
                  <div>
                    <p className="text-sm text-muted-foreground">Tenant</p>
                    <p className="font-medium">{unit.owner ? `${unit.owner.first_name} ${unit.owner.last_name}`   : "—"}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ownership" className="mt-6">
            {unit.ownership_file ? (
              <Card>
                <CardHeader>
                  <CardTitle>Ownership Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={unit.ownership_file.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Document
                  </a>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">
                No ownership document uploaded.
              </p>
            )}
          </TabsContent>

          <TabsContent value="leases" className="mt-6">
            {unit.leases && unit.leases.length ? (
              <div className="space-y-3">
                {unit.leases.map((lease) => (
                  <Card key={lease.id}>
                    <CardHeader>
                      <CardTitle>Lease #{lease.id}</CardTitle>
                      <CardDescription>
                        {lease.start_date} → {lease.end_date}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Status: {lease.status}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No leases found.</p>
            )}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
