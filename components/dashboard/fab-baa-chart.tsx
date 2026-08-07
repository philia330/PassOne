"use client";

import { useEffect, useState } from "react";
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
import { TrendingUp, TrendingDown, Minus, BarChart3, TrendingUpIcon, AreaChart as AreaChartIcon } from "lucide-react";

type MonthlyData = {
  label: string;
  fab: number;
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
  const [monthly, setMonthly] =
    useState(initialMonthly);

  const [period, setPeriod] =
    useState(6);

  const [chartType, setChartType] =
    useState<"bar" | "line" | "area">("bar");

  const [loading, setLoading] =
    useState(false);

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

        <ResponsiveContainer
          width="100%"
          height={320}
        >
          {chartType === "bar" && (
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} wrapperClassName="dark:[&_.recharts-default-tooltip]:!bg-slate-800 dark:[&_.recharts-default-tooltip]:!border-slate-700 dark:[&_.recharts-default-tooltip]:!text-white" />
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
              <Bar dataKey="fab" name="FAB" fill="#6ad2ff" radius={[6, 6, 0, 0]} />
              <Bar dataKey="baa" name="BAA" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          )}
          {chartType === "line" && (
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} wrapperClassName="dark:[&_.recharts-default-tooltip]:!bg-slate-800 dark:[&_.recharts-default-tooltip]:!border-slate-700 dark:[&_.recharts-default-tooltip]:!text-white" />
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
              <Line type="monotone" dataKey="fab" name="FAB" stroke="#6ad2ff" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="baa" name="BAA" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          )}
          {chartType === "area" && (
            <AreaChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-slate-400 dark:text-slate-500" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} wrapperClassName="dark:[&_.recharts-default-tooltip]:!bg-slate-800 dark:[&_.recharts-default-tooltip]:!border-slate-700 dark:[&_.recharts-default-tooltip]:!text-white" />
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
              <Area type="monotone" dataKey="fab" name="FAB" fill="#6ad2ff" stroke="#6ad2ff" fillOpacity={0.3} />
              <Area type="monotone" dataKey="baa" name="BAA" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
            </AreaChart>
          )}
        </ResponsiveContainer>

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