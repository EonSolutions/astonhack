// HistoryCard.jsx

import React, { useEffect, useState } from "react";
import { AiOutlineCalendar } from "react-icons/ai";
import { db } from "./lib/firebase";
import {
  getDocs,
  query,
  collection,
  orderBy
} from "firebase/firestore";
import "./HistoryCard.css";

export default function HistoryCard() {
  const [outfitHistory, setOutfitHistory] = useState([]);

  // 🔥 Hardcode all top-level collections here:
  const collectionNames = [
    "long_sleeve_outwear",
    "long_sleeve_top",
    "shirts",
    "short_sleeve_dress",
    "short_sleeve_top",
    "shorts",
    "skirt",
    "trousers",
    "vest",
  ];

  useEffect(() => {
    const fetchOutfits = async () => {
      try {
        console.log("🔥 Fetching outfits from all top-level collections...");

        let allOutfits = [];

        // Fetch documents from each collection
        const outfitPromises = collectionNames.map(async (colName) => {
          console.log(`📂 Fetching from collection: ${colName}`);
          const outfitQuery = query(collection(db, colName), orderBy("date", "desc"));
          const querySnapshot = await getDocs(outfitQuery);

          // Convert each doc to a JS object
          return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // If your 'date' field is a string, convert it to a Date object:
            date: new Date(doc.data().date),
          }));
        });

        // Wait for all queries to finish
        allOutfits = (await Promise.all(outfitPromises)).flat();

        // Sort the combined array by date (newest first)
        allOutfits.sort((a, b) => b.date - a.date);

        console.log("✅ Final sorted outfit history:", allOutfits);
        setOutfitHistory(allOutfits);
      } catch (error) {
        console.error("❌ Error fetching outfits:", error);
      }
    };

    fetchOutfits();
  }, []);

  return (
    <div className="history-card">
      <h3 className="card-title">📅 Outfit History</h3>
      <div className="outfit-history">
        {outfitHistory.length > 0 ? (
          outfitHistory.map((entry) => (
            <div key={entry.id} className="outfit-item">
              <img src={entry.image} alt={entry.name} className="outfit-image" />
              <div className="outfit-info">
                <h3>{entry.name}</h3>
                <p className="date-info">
                  <AiOutlineCalendar className="icon" />
                  {entry.date.toLocaleDateString()}
                </p>

              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "red", backgroundColor: "lightgray" }}>
            ⚠️ No outfit history available.
          </p>
        )}
      </div>
    </div>
  );
}