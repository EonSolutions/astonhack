import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  orderBy,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import OutfitHistoryCard from "./HistoryCard";
import OutfitChartCard from "./ChartCard";
import ExtraCard from "./ExtraCard";
import BottomNavbar from "./BottomNavbar"; // Import the BottomNavbar component
import "./Dashboard.css";

export default function Dashboard() {
  const [outfitHistory, setOutfitHistory] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [showPopup, setShowPopup] = useState(false); // 🔹 Add this state for the Plus button

  useEffect(() => {
    const fetchAllCollections = async () => {
      const db = getFirestore();
      let allItems = [];
      let categoryCount = {};

      const collections = [
        "short_sleeve_top",
        "long_sleeve_top",
        "short_sleeve_outwear",
        "long_sleeve_outwear",
        "vest",
        "sling",
        "shorts",
        "trousers",
        "skirt",
        "short_sleeve_dress",
        "long_sleeve_dress",
        "vest_dress",
        "sling_dress",
      ];

      try {
        for (const category of collections) {
          console.log(`Fetching documents from collection: ${category}`);

          const clothesQuery = query(
            collection(db, category),
            orderBy("date", "desc")
          );
          const querySnapshot = await getDocs(clothesQuery);

          categoryCount[category] =
            (categoryCount[category] || 0) + querySnapshot.size;

          const collectionItems = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            category: category,
            name: doc.data().name || "Unnamed Item",
            description: doc.data().description || "No description available",
            date: doc.data().date ? new Date(doc.data().date) : new Date(0),
            image: doc.data().image || "",
          }));

          allItems = [...allItems, ...collectionItems];
        }

        allItems.sort((a, b) => b.date - a.date);
        const top5NewOutfits = allItems.slice(0, 5);
        console.log("🔥 Top 5 newest worn clothes:", top5NewOutfits);
        setOutfitHistory(top5NewOutfits);

        const formattedCategoryData = Object.keys(categoryCount).map((key) => ({
          name: key.replace(/_/g, " "),
          value: categoryCount[key],
        }));

        console.log("📊 Outfit Category Breakdown:", formattedCategoryData);
        setCategoryData(formattedCategoryData);
      } catch (error) {
        console.error("❌ Error fetching collections:", error);
      }
    };

    fetchAllCollections();
  }, []);

  return (
    <div>
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

  {/* 🔹 Ensure the shirt button is always visible by setting hasMiddle to false */}
  <BottomNavbar hasMiddle={false} />
</div>

  );
}
