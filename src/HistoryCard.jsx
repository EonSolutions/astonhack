import React from "react";
import { AiOutlineCalendar } from "react-icons/ai";
import "./HistoryCard.css";

export default function HistoryCard({ outfitHistory }) {
  return (
    <div className="history-card">
      <h3 className="card-title">📅 Outfit History</h3>
      <div className="outfit-history">
        {outfitHistory.length > 0 ? (
          outfitHistory.map((entry) => (
            <div key={entry.id} className="outfit-item">
              <img src={entry.image} alt={entry.name} className="outfit-image" />
              <div className="outfit-info">
                <h3>{entry.name}</h3>  {/* ✅ Use `entry.name` instead of `entry.outfit` */}
                <p><AiOutlineCalendar className="icon" /> {entry.date.toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No outfit history available.</p>
        )}
      </div>
    </div>
  );
}
