import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Bar } from "react-chartjs-2";
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from "chart.js";
  
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
  
  export default function Reports() {
    const data = {
      labels: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
      ],
      datasets: [
        {
          label: "Revenue",
          data: [2000, 3000, 2500, 4000, 3500, 5000, 4500],
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Expenses",
          data: [1500, 2000, 1800, 2500, 2200, 3000, 2800],
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    };
  
    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: "Revenue vs Expenses",
        },
      },
    };
  
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Birr 11,000</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Birr 8,400</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Net Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Birr 2,600</p>
            </CardContent>
          </Card>
        </div>
  
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[500px]">
              <Bar data={data} options={options} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  