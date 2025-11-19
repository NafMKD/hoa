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
import {
  downloadDocumentTemplate,
  fetchDocumentTemplateDetail,
} from "./lib/templates";
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
import mammoth from "mammoth";
import { cn } from "@/lib/utils";

export function DocumentTemplateDetail() {
  const { templateId } = useParams({
    from: "/_authenticated/admin/templates/$templateId",
  });
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [docHtml, setDocHtml] = useState<string>("");

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const data = await fetchDocumentTemplateDetail(templateId as string);
        setTemplate(data);

        if (data.id) {
          // Download the DOCX file using your custom API helper
          const blob = await downloadDocumentTemplate(data.id);

          // Convert Blob to ArrayBuffer for Mammoth
          const arrayBuffer = await blob.arrayBuffer();

          // Convert DOCX to HTML using Mammoth
          const { value } = await mammoth.convertToHtml({ arrayBuffer });
          setDocHtml(value);
        }
      } catch (error) {
        console.error("Failed to load DOCX file:", error);
        setDocHtml(
          "<p class='text-red-500'>Failed to load document preview.</p>"
        );
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
        <Main className="container mx-auto px-4 py-6 space-y-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-20" />
          <Card className="border-muted shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-60 mt-2" />
            </CardHeader>
            <CardContent className="h-96">
              <Skeleton className="h-full w-full" />
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

      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Document Template Details
          </h1>
          <Button variant="outline" asChild>
            <Link to="/admin/templates">
              <IconArrowLeft size={16} className="mr-1" />
              Back
            </Link>
          </Button>
        </div>

        {/* Template Meta Collapsible Card */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Card className="shadow-sm border-muted cursor-pointer">
              <CardHeader>
                <CardTitle>{template.name || template.sub_category}</CardTitle>
                <CardDescription>
                  Click to view template details
                </CardDescription>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="shadow-sm border-muted mt-2">
              <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{template.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sub Category</p>
                  <p className="font-medium">{template.sub_category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-medium">{template.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{template.created_at || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Updated At</p>
                  <p className="font-medium">{template.updated_at || "—"}</p>
                </div>
                {template.description && (
                  <div className="sm:col-span-2 md:col-span-3">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{template.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Document Preview Card */}
        <Card className="shadow-sm border-muted mt-4 relative">
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
            <CardDescription>Preview the uploaded .docx file</CardDescription>
            {template.path && (
              <Button
                size="sm"
                variant="outline"
                className="absolute right-4 top-4"
                asChild
              >
                <a href={template.path as string} download>
                  <IconDownload className="mr-1" /> Download
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent className="h-[80vh] overflow-auto p-6">
            {docHtml ? (
              <div
                className={cn(
                  "document-container prose prose-lg max-w-none",
                  "mx-auto bg-white px-8 py-12 md:px-16 md:py-16",
                  // Images
                  "[&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:mx-auto",
                  // Tables
                  "[&_table]:w-full [&_table]:border-collapse [&_table]:my-6",
                  "[&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-2",
                  "[&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
                  // Blockquote
                  "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-400 [&_blockquote]:pl-6 [&_blockquote]:my-6 [&_blockquote]:italic",
                  // Code / pre
                  "[&_pre]:overflow-x-auto [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg",
                  "[&_code]:font-mono [&_code]:text-sm",
                  // Lists
                  "[&_ol]:list-decimal [&_ol]:pl-8",
                  "[&_ul]:list-disc [&_ul]:pl-8",
                  // Force black text (some PDFs have weird colors)
                  "[&_*]:!text-black"
                )}
                dangerouslySetInnerHTML={{ __html: docHtml }}
                style={{
                  width: "100%",
                  height: "85%",
                  overflow: "auto",
                }}
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
