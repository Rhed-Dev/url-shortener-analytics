"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { BreakdownRow } from "@/lib/stats";

const COLORS = ["#8b5cf6", "#d946ef", "#38bdf8", "#34d399"];

export function DeviceDonut({ data }: { data: BreakdownRow[] }) {
  const total = data.reduce((sum, row) => sum + row.clicks, 0);

  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        No clicks recorded yet.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="clicks"
              nameKey="label"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((row, i) => (
                <Cell key={row.label} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [String(value), String(name)]}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2.5">
        {data.map((row, i) => (
          <li key={row.label} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="capitalize text-slate-300">{row.label}</span>
            <span className="text-xs text-slate-500">
              {Math.round((row.clicks / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
