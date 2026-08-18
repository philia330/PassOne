"use client";

import { useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  TrendingUpIcon,
  AreaChart as AreaChartIcon,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MonthlyData = {
  label: string;
  fabOpen: number;
  fabAktif: number;
  baa: number;
};

type StatusData = {
  name: string;
  value: number;
};

type ComparisonData = {
  fab: {
    current: number;
    previous: number;
    changePercent: number;
  };
  baa: {
    current: number;
    previous: number;
    changePercent: number;
  };
};

// Tren chart colors
const TREN_FAB_OPEN_COLOR = "#f97316";   // oranye — FAB Open
const TREN_FAB_AKTIF_COLOR = "#10b981";  // hijau — FAB Aktif
const TREN_BAA_COLOR = "#8b5cf6";        // ungu — BAA

const STATUS_COLORS: Record<string, string> = {
  // FAB
  OPEN: "#f97316",     // oranye — masih menunggu tindak lanjut
  AKTIF: "#10b981",    // hijau — sudah aktif/terpasang

  // BAA
  SELESAI: "#10b981",  // hijau — selesai (satu-satunya status BAA sekarang)
};

const PERIOD_OPTIONS = [
  {
    label: "3 Bulan Terakhir",
    value: 3,
  },
  {
    label: "6 Bulan Terakhir",
    value: 6,
  },
  {
    label: "12 Bulan Terakhir",
    value: 12,
  },
];

// Helper function to calculate Y-axis domain with proper padding
function calculateYAxisDomain(data: MonthlyData[]): [number, number] {
  if (!data || data.length === 0) return [0, 10];

  const maxValue = Math.max(...data.map((d) => Math.max(d.fabOpen, d.fabAktif, d.baa)));

  if (maxValue === 0) return [0, 10];

  // Kasih ruang lega di atas biar bar tidak mepet ke batas atas chart
  const paddedMax = Math.ceil(maxValue * 1.4);

  // Bulatkan ke kelipatan 10 biar angka di sumbu Y rapi
  const niceMax = Math.ceil(paddedMax / 10) * 10;

  return [0, Math.max(niceMax, 10)];
}

// Download data mentah (angka per bulan) sebagai CSV -- bisa dibuka di Excel
function downloadCSV(data: MonthlyData[], filename: string) {
  const headers = ["Bulan", "FAB Open", "FAB Aktif", "BAA"];
  const rows = data.map((d) => [d.label, d.fabOpen, d.fabAktif, d.baa]);
  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function TrendBadge({
  changePercent,
}: {
  changePercent: number;
}) {
  if (changePercent === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <Minus size={12} />
        0%
      </span>
    );
  }

  const isPositive = changePercent > 0;

  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        isPositive
          ? "text-emerald-600"
          : "text-red-500"
      }`}
    >
      {isPositive ? (
        <TrendingUp size={12} />
      ) : (
        <TrendingDown size={12} />
      )}

      {Math.abs(changePercent)}%
    </span>
  );
}

export default function FabBaaChart({
  initialMonthly,
  fabStatus,
  baaStatus,
  comparison,
}: {
  initialMonthly: MonthlyData[];
  fabStatus: StatusData[];
  baaStatus: StatusData[];
  comparison: ComparisonData;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [monthly, setMonthly] =
    useState(initialMonthly);

  const [period, setPeriod] =
    useState(6);

  const [chartType, setChartType] =
    useState<"bar" | "line" | "area">("bar");

  const [loading, setLoading] =
    useState(false);

  // Calculate Y-axis domain based on data
  const yAxisDomain = calculateYAxisDomain(monthly);

  useEffect(() => {
    if (period === 6) {
      setMonthly(initialMonthly);
      return;
    }

    setLoading(true);

    fetch(`/api/dashboard-chart?months=${period}`)
      .then((res) => res.json())
      .then((data) =>
        setMonthly(data.monthly ?? [])
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period, initialMonthly]);

  const handleDownloadData = () => {
    downloadCSV(monthly, `data-tren-fab-baa-${new Date().toISOString().split("T")[0]}`);
  };

  const scrollChart = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const amount = 220; // geser sekitar 2 bulan tiap klik
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">

      {/* ================= BAR CHART ================= */}

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-none sm:p-6 lg:col-span-2">

        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-bold dark:text-white">
              Tren FAB & BAA
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-4">

              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                FAB
                <TrendBadge
                  changePercent={
                    comparison.fab.changePercent
                  }
                />
              </span>

              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                BAA
                <TrendBadge
                  changePercent={
                    comparison.baa.changePercent
                  }
                />
              </span>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download Button -- sekarang cuma CSV, PNG/JPG dihapus */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <Download size={14} />
                <span className="hidden sm:inline">Unduh</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem
                  onClick={handleDownloadData}
                  className="cursor-pointer rounded-lg gap-2"
                >
                  <FileSpreadsheet size={16} className="text-slate-500" />
                  <span>Unduh Data (CSV)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Chart Type Selector */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setChartType("bar")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition ${
                  chartType === "bar"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <BarChart3 size={14} />
              </button>
              <button
                onClick={() => setChartType("line")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition border-l border-slate-200 dark:border-slate-700 ${
                  chartType === "line"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <TrendingUpIcon size={14} />
              </button>
              <button
                onClick={() => setChartType("area")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition border-l border-slate-200 dark:border-slate-700 ${
                  chartType === "area"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <AreaChartIcon size={14} />
              </button>
            </div>

            <select
              value={period}
              onChange={(e) =>
                setPeriod(Number(e.target.value))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="relative">
          {/* Tombol scroll kiri */}
          <button
            type="button"
            onClick={() => scrollChart("left")}
            className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Tombol scroll kanan */}
          <button
            type="button"
            onClick={() => scrollChart("right")}
            className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-500 hover:bg-slate-50 hover:text-purple-600 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <ChevronRight size={16} />
          </button>

          <div ref={scrollContainerRef} className="chart-scroll-x overflow-x-auto rounded-xl">
            <div
              className="relative"
              style={{ width: Math.max(monthly.length * 110, 100), minWidth: "100%" }}
            >
              <ResponsiveContainer
                width="100%"
                height={420}
              >
                {chartType === "bar" && (
                  <BarChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" domain={yAxisDomain} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} wrapperClassName="dark:[&_.recharts-default-tooltip]:!bg-slate-800 dark:[&_.recharts-default-tooltip]:!border-slate-700 dark:[&_.recharts-default-tooltip]:!text-white" />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Bar dataKey="fabOpen" name="FAB Open" fill={TREN_FAB_OPEN_COLOR} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fabAktif" name="FAB Aktif" fill={TREN_FAB_AKTIF_COLOR} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="baa" name="BAA" fill={TREN_BAA_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
                {chartType === "line" && (
                  <LineChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" domain={yAxisDomain} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} wrapperClassName="dark:[&_.recharts-default-tooltip]:!bg-slate-800 dark:[&_.recharts-default-tooltip]:!border-slate-700 dark:[&_.recharts-default-tooltip]:!text-white" />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Line type="monotone" dataKey="fabOpen" name="FAB Open" stroke={TREN_FAB_OPEN_COLOR} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="fabAktif" name="FAB Aktif" stroke={TREN_FAB_AKTIF_COLOR} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="baa" name="BAA" stroke={TREN_BAA_COLOR} strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                )}
                {chartType === "area" && (
                  <AreaChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" domain={yAxisDomain} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} wrapperClassName="dark:[&_.recharts-default-tooltip]:!bg-slate-800 dark:[&_.recharts-default-tooltip]:!border-slate-700 dark:[&_.recharts-default-tooltip]:!text-white" />
                    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                    <Area type="monotone" dataKey="fabOpen" name="FAB Open" fill={TREN_FAB_OPEN_COLOR} stroke={TREN_FAB_OPEN_COLOR} fillOpacity={0.3} />
                    <Area type="monotone" dataKey="fabAktif" name="FAB Aktif" fill={TREN_FAB_AKTIF_COLOR} stroke={TREN_FAB_AKTIF_COLOR} fillOpacity={0.3} />
                    <Area type="monotone" dataKey="baa" name="BAA" fill={TREN_BAA_COLOR} stroke={TREN_BAA_COLOR} fillOpacity={0.3} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {loading && (
          <p className="mt-3 text-center text-xs text-slate-400 dark:text-slate-500">
            Memuat data...
          </p>
        )}

      </div>
            {/* ================= PIE CHART ================= */}

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-none sm:p-6">

        {/* FAB */}

        <h2 className="mb-4 text-lg font-bold dark:text-white">
          Status FAB
        </h2>

        <ResponsiveContainer
          width="100%"
          height={200}
        >
          <PieChart>
            <Pie
              data={fabStatus}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={3}
            >
          {fabStatus.map((entry) => (
            <Cell
              key={entry.name}
              fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
            />
          ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-3 space-y-2">
          {fabStatus.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">

                <span
  className="h-2.5 w-2.5 rounded-full"
  style={{
    backgroundColor: STATUS_COLORS[item.name] ?? "#94a3b8",
  }}
/>

                {item.name}

              </span>

              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* BAA */}

        <h2 className="mb-4 mt-8 text-lg font-bold dark:text-white">
          Status BAA
        </h2>

        <ResponsiveContainer
          width="100%"
          height={200}
        >
          <PieChart>
            <Pie
              data={baaStatus}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={72}
              paddingAngle={3}
            >
              {baaStatus.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    STATUS_COLORS[entry.name] ??
                    "#94a3b8"
                  }
                />
              ))}
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="mt-3 space-y-2">
          {baaStatus.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">

                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[item.name] ??
                      "#94a3b8",
                  }}
                />

                {item.name}

              </span>

              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {item.value}
              </span>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}