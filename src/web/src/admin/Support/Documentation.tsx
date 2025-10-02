// Documentation.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Search } from "lucide-react";

type Doc = {
  id: number;
  title: string;
  category: string;
  description: string;
  file: string;
};

const demoDocs: Doc[] = [
  { id: 1, title: "HOA Guidelines", category: "Rules", description: "Official HOA rules and regulations.", file: "guidelines.pdf" },
  { id: 2, title: "Annual Financial Report", category: "Financials", description: "Summary of the yearly financials.", file: "financial_report.pdf" },
  { id: 3, title: "Maintenance Procedures", category: "Operations", description: "Step-by-step maintenance guides.", file: "maintenance.pdf" },
  { id: 4, title: "Emergency Contacts", category: "Support", description: "Important contacts for emergencies.", file: "contacts.pdf" },
  { id: 5, title: "Meeting Minutes", category: "Meetings", description: "Minutes from last board meetings.", file: "minutes.pdf" },
];

export default function Documentation() {
  const [search, setSearch] = useState("");

  const filteredDocs = demoDocs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.category.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Search documentation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export All</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length ? (
          filteredDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{doc.title}</CardTitle>
                <CardDescription>{doc.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{doc.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Download
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground mt-8">No documentation found.</p>
        )}
      </div>
    </div>
  );
}
