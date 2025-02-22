import React, { useState, useEffect } from "react";
import OutfitHistoryCard from "./HistoryCard";
import OutfitChartCard from "./ChartCard";
import ExtraCard from "./ExtraCard";
import "./Dashboard.css";

export default function Dashboard() {
  const [outfitHistory, setOutfitHistory] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  useEffect(() => {
    const mockData = [
      { id: 1, date: "2025-02-20", outfit: "Casual Red T-Shirt & Jeans", category: "Shirts", image: "https://raven.contrado.app/resources/images/2020-10/155441/personalised-photo-tshirt1527448_l.jpeg?w=400" },
      { id: 2, date: "2025-02-18", outfit: "Blue Hoodie & Sweatpants", category: "Hoodies", image: "https://images.unsplash.com/photo-1602810318660-7a7a0086a5a2?w=400" },
      { id: 3, date: "2025-02-15", outfit: "Black Jacket & Beige Pants", category: "Jackets", image: "https://images.unsplash.com/photo-1602810318660-7a7a0086a5a3?w=400" },
      { id: 4, date: "2025-02-10", outfit: "Casual Red T-Shirt & Jeans", category: "Shirts", image: "https://raven.contrado.app/resources/images/2020-10/155441/personalised-photo-tshirt1527448_l.jpeg?w=400" },
      { id: 5, date: "2025-02-08", outfit: "Blue Hoodie & Sweatpants", category: "Hoodies", image: "https://images.unsplash.com/photo-1602810318660-7a7a0086a5a2?w=400" },
    ];

    setOutfitHistory(mockData);

    // Count categories
    const categoryCount = {};
    mockData.forEach((entry) => {
      categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
    });

    // Convert to array format
    const formattedData = Object.keys(categoryCount).map((key) => ({
      name: key,
      value: categoryCount[key],
    }));

    setCategoryData(formattedData);
  }, []);

  return (
    <div className="dashboard-container">
      {/* Left Side - Outfit History */}
      <div className="left-column">
        <OutfitHistoryCard outfitHistory={outfitHistory} />
      </div>

      {/* Right Side - Pie Chart (Top) & Extra Info (Bottom) */}
      <div className="right-column">
        <OutfitChartCard categoryData={categoryData} />
        <ExtraCard />
      </div>
    </div>
  );
}