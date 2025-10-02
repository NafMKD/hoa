import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardProps {
  setBreadcrumb: (breadcrumb: React.ReactNode) => void;
}

export default function Dashboard({ setBreadcrumb }: DashboardProps) {
  useEffect(() => {
    setBreadcrumb(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }, [setBreadcrumb]);

  // ===================== DATA =====================
  const cardData = [
    { title: "Total Residents", value: 124 },
    { title: "Pending Fees", value: 32 },
    { title: "Active Vehicle Stickers", value: 5 },
    { title: "Vehicles Registered", value: 58 },
    { title: "Monthly Income", value: "$12,400" },
  ];

  const paymentsData = [
    { name: "John Doe", amount: "$120", status: "Paid" },
    { name: "Jane Smith", amount: "$80", status: "Pending" },
    { name: "Robert Brown", amount: "$100", status: "Paid" },
    { name: "Alice Green", amount: "$200", status: "Paid" },
  ];

  const complaintsData = [
    { status: "Replaced", value: 5 },
    { status: "Active", value: 18 },
    { status: "Lost", value: 3 },
  ];

  const residentTypeData = [
    { type: "Owners", value: 80 },
    { type: "Tenants", value: 44 },
  ];

  const barData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Fees Collected",
        data: [500, 700, 600, 800, 750, 900],
        backgroundColor: "rgba(34,197,94,0.7)",
      },
    ],
  };

  const lineData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Fee Trend",
        data: [1200, 1500, 1300, 1700],
        borderColor: "rgba(59,130,246,0.7)",
        backgroundColor: "rgba(59,130,246,0.3)",
        tension: 0.4,
      },
    ],
  };

  const pieData = {
    labels: complaintsData.map((c) => c.status),
    datasets: [
      {
        data: complaintsData.map((c) => c.value),
        backgroundColor: ["#f87171", "#34d399", "#fbbf24"],
      },
    ],
  };

  const doughnutData = {
    labels: residentTypeData.map((r) => r.type),
    datasets: [
      {
        data: residentTypeData.map((r) => r.value),
        backgroundColor: ["#3b82f6", "#10b981"],
      },
    ],
  };

  // ===================== RENDER =====================
  return (
    <div className="space-y-4">
      {/* ====== STATS CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cardData.map((card) => (
          <Card key={card.title} className="bg-muted/50 rounded-xl">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{card.value}</CardContent>
          </Card>
        ))}
      </div>

      {/* ====== TABLE + BAR CHART ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-muted/50 rounded-xl">
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentsData.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.amount}</TableCell>
                    <TableCell>{p.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 rounded-xl">
          <CardHeader>
            <CardTitle>Monthly Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar
                data={barData}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== PIE + DOUGHNUT CHARTS ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-muted/50 rounded-xl">
          <CardHeader>
            <CardTitle>Vehicle Stickers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie data={pieData} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 rounded-xl">
          <CardHeader>
            <CardTitle>Residents Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={doughnutData} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== LINE CHART ====== */}
      <Card className="bg-muted/50 rounded-xl">
        <CardHeader>
          <CardTitle>Weekly Fee Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={lineData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
