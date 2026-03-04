"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AttendancePieChartProps {
  data: any[];
  colors: {
    present: string;
    absent: string;
  };
  isMobile: boolean;
}

export default function AttendancePieChart({
  data,
  colors,
  isMobile,
}: AttendancePieChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={isMobile ? 60 : 80}
          label={(props) =>
            `${props.payload.name}: ${props.payload.percentage}%`
          }>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.name === "Present" ? colors.present : colors.absent}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any, name: any, props: any) => [
            `${value} lectures (${props.payload.percentage}%)`,
            name,
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
