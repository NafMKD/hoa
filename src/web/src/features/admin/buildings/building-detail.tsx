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
import { fetchBuildingDetail } from "./lib/buildings"; 
import type { Building } from "@/types/types";
import { Link, useParams } from "@tanstack/react-router";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { IconArrowLeft, IconArrowLeftCircle } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function BuildingDetail() {
  const { buildingId } = useParams({ from: "/_authenticated/admin/buildings/$buildingId" });
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBuilding = async () => {
      try {
        const data = await fetchBuildingDetail(buildingId as string);
        setBuilding(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadBuilding();
  }, [buildingId]);

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
        </Main>
      </>
    );
  }

  if (!building) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">Building not found.</p>
          <Button asChild>
            <Link to="/admin/buildings">
              <IconArrowLeftCircle size={16} className="mr-1" />
              Back to Buildings
            </Link>
          </Button>
        </div>
      </Main>
    );
  }

  const totalUnits = building.units ? building.units.length : 0;

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
          <h1 className="text-2xl font-bold tracking-tight">Building Details</h1>
          <Button variant="outline" asChild>
            <Link to="/admin/buildings">
              <IconArrowLeft size={16} className="mr-1" />
              Back
            </Link>
          </Button>
        </div>

        <Card className="border-muted shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl font-semibold leading-tight">
                      Building - {building.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Detailed information and management options for this building.
                </CardDescription>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Address
                    </p>
                    <p className="text-sm font-medium break-all">{building.address || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Floors
                    </p>
                    <p className="text-sm font-medium break-all">{building.floors || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Units per Floor
                    </p>
                    <p className="text-sm font-medium break-all">{building.units_per_floor || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created At
                    </p>
                    <p className="text-sm font-medium break-all">{building.created_at || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Updated At
                    </p>
                    <p className="text-sm font-medium break-all">{building.updated_at || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="grid w-full max-w-xs grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm md:grid-cols-1">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total units
                  </p>
                  <p className="text-lg font-semibold">{totalUnits}</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="units" className="w-full">
          <TabsList className="flex flex-wrap gap-2 w-full">
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="note">Note</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-6 space-y-8">
          <section>
              <h2 className="text-lg font-semibold mb-3">Owned Units</h2>

              {building.units?.length ? (
                <div className="bg-card/70 backdrop-blur-sm shadow-md rounded-xl p-2 border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-1/3">Unit Name</TableHead>
                        <TableHead>Area (sqm) </TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {building.units.map((unit) => (
                        <TableRow
                          key={unit.id}
                          className="hover:bg-muted/40 transition"
                        >
                          <TableCell>
                            <Link
                              to="/admin/units/$unitId"
                              params={{ unitId: unit.id as string }}
                              target="_blank"
                              className="underline hover:text-primary transition"
                            >
                              {unit.name || `Unit #${unit.id}`}
                            </Link>
                          </TableCell>
                          <TableCell>{unit.size_m2 || "No Size"}</TableCell>
                          <TableCell>{unit.type_name || "No Size"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No owned units.</p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="note" className="mt-6">
            {building.notes ? (
              <Card className="border-muted shadow-sm">
                <CardContent>
                  <p>{building.notes}</p>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">No notes available.</p>
            )}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}
