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
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDocumentTemplateDetail } from "./lib/templates";
import type { DocumentTemplate } from "@/types/types";
import { Link, useParams } from "@tanstack/react-router";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  IconArrowLeft,
  IconArrowLeftCircle,
  IconDownload,
} from "@tabler/icons-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

export function DocumentTemplateDetail() {
  const { templateId } = useParams({
    from: "/_authenticated/admin/templates/$templateId",
  });
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const data = await fetchDocumentTemplateDetail(templateId as string);
        setTemplate(data);
      } catch (error) {
        console.error("Error fetching template details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplate();
  }, [templateId]);

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
        <Main className="container mx-auto px-6 py-8 space-y-10">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-20" />
          <Card className="shadow-lg border-muted">
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

  if (!template) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">Template not found.</p>
          <Button asChild>
            <Link to="/admin/templates">
              <IconArrowLeftCircle size={16} className="mr-1" />
              Back to Templates
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

      <Main className="container mx-auto px-6 py-10 space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Document Template Details</h1>
          <Button variant="outline" asChild>
            <Link to="/admin/templates">
              <IconArrowLeft size={16} className="mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* --- Template Meta Card (Collapsible) --- */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Card className="shadow-sm border-muted/60 cursor-pointer">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <span>{template.name || template.sub_category}</span>
                    {template.version && (
                      <Badge
                        variant="outline"
                        className="text-xs font-medium rounded-full px-2 py-0.5"
                      >
                       Version - {template.version}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Click to view template details
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="shadow-lg border-muted mt-4">
              <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t pt-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Category
                  </p>
                  <p className="font-medium">{template.category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Sub Category
                  </p>
                  <p className="font-medium">{template.sub_category}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created At
                  </p>
                  <p className="font-medium">{template.created_at || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Updated At
                  </p>
                  <p className="font-medium">{template.updated_at || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created By
                  </p>
                  <p className="font-medium">
                    {template.created_by?.full_name || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Updated By
                  </p>
                  <p className="font-medium">
                    {template.updated_by?.full_name || "—"}
                  </p>
                </div>
                {template.description && (
                  <div className="sm:col-span-2 md:col-span-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>
                    <p className="font-medium">{template.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* --- Document Preview Section with PDF iframe --- */}
        <Card className="shadow-lg border-muted mt-6 relative">
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>Preview the uploaded .pdf file</CardDescription>
            {template.pdf_url && (
              <Button
                size="sm"
                variant="outline"
                className="absolute right-4 top-4"
                asChild
              >
                <a href={template.url} target="_blank">
                  <IconDownload className="mr-1" /> Download PDF
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent className="h-[80vh] overflow-auto p-8">
            {template.pdf_url ? (
              <iframe
                src={template.pdf_url}
                className="h-full w-full rounded-md border bg-muted"
                title="Document Preview"
              />
            ) : (
              <p className="text-muted-foreground">
                No document content available.
              </p>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
