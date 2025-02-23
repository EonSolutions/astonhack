import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import "./ChartCard.css";

export default function ChartCard({ categoryData }) {
  const COLORS = ["#0088FE", "#FFBB28", "#FF8042", "#00C49F", "#933ddd"];

  // Filter out categories with a value of 0
  const filteredData = categoryData.filter((entry) => entry.value !== 0);

  return (
    <div className="chart-card">
      <h3 className="card-title">🛍️ Outfit Category Breakdown</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={filteredData} // Use the filtered data here
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}