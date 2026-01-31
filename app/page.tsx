"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/blocks")
      .then((res) => res.json())
      .then((data) => setBlocks(data));
  }, []);
// Group blocks by block_number
const groupedBlocks = Object.values(
  blocks.reduce((acc: any, curr: any) => {
    if (!acc[curr.block_number]) {
      acc[curr.block_number] = {
        block: curr.block_number,
        totalGas: 0,
        count: 0,
      };
    }
    acc[curr.block_number].totalGas += Number(curr.gas_used || 0);
    acc[curr.block_number].count += 1;
    return acc;
  }, {})
);

  // Metrics
  const totalBlocks = blocks.length;
  const latestBlock = blocks[0]?.block_number || "N/A";
  const avgGas =
    totalBlocks > 0
      ? Math.round(
          blocks.reduce(
            (sum, b) => sum + Number(b.gas_used || 0),
            0
          ) / totalBlocks
        )
      : 0;

  // Prepare data for chart
  const chartData = blocks
    .slice(0, 20)
    .reverse()
    .map((b) => ({
      block: b.block_number.slice(0, 6),
      gas: Number(b.gas_used),
    }));

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      {/* TITLE */}
      <h1 style={{ fontSize: "32px" }}>QUAI Blocks Dashboard</h1>
      <p style={{ color: "#aaa", marginBottom: "30px" }}>
        Data from QUAI Scan API
      </p>

      {/* METRIC CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div className="card">
          <p>Total Blocks</p>
          <h2>{totalBlocks}</h2>
        </div>

        <div className="card">
          <p>Latest Block</p>
          <h2>{latestBlock}</h2>
        </div>

        <div className="card">
          <p>Average Gas Used</p>
          <h2>{avgGas}</h2>
        </div>
      </div>
      <h2 style={{ marginBottom: "10px", opacity: 0.9 }}>
  Network Activity
</h2>


      {/* GRAPH */}
      <div className="card" style={{ height: "300px" }}>
        <h3 style={{ marginBottom: "15px" }}>
          Gas Used Trend (Recent Blocks)
        </h3>

        <ResponsiveContainer width="100%" height="100%">
  <LineChart data={chartData}>
    <defs>
      <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff4ecd" />
        <stop offset="100%" stopColor="#7f00ff" />
      </linearGradient>
    </defs>

    <XAxis dataKey="block" />
    <YAxis />
    <Tooltip />

    <Line
      type="monotone"
      dataKey="gas"
      stroke="url(#pinkGradient)"
      strokeWidth={3}
      dot={{ r: 4 }}
      activeDot={{ r: 7 }}
    />
  </LineChart>
</ResponsiveContainer>

      </div>
      <h2 style={{ margin: "40px 0 10px", opacity: 0.9 }}>
  Recent Blocks
</h2>


      {/* TABLE */}
      <table
        style={{
          width: "100%",
          marginTop: "40px",
          borderCollapse: "collapse",
          opacity: 0.85,
        }}
      >
       <thead>
  <tr>
    <th align="left">Block</th>
    <th align="left">Total Gas Used</th>
    <th align="left">Tx Count</th>
  </tr>
</thead>


        <tbody>
  {groupedBlocks.slice(0, 10).map((b: any, i: number) => (
    <tr key={i} style={{ borderBottom: "1px solid #222" }}>
      <td>{b.block}</td>

      <td>
        {b.totalGas.toLocaleString()}
        <div
          style={{
            height: "6px",
            background: "#222",
            borderRadius: "4px",
            marginTop: "6px",
          }}
        >
          <div
            style={{
              width: `${Math.min(b.totalGas / 30000, 100)}%`,
              height: "100%",
              background: "linear-gradient(90deg, #ff4ecd, #7f00ff)",
              borderRadius: "4px",
            }}
          />
        </div>
      </td>

      <td>{b.count}</td>
    </tr>
  ))}
</tbody>

      </table>
    </main>
  );
}
