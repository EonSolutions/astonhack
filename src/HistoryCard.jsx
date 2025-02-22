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
              <img src={entry.image} alt={entry.outfit} className="outfit-image" />
              <div className="outfit-info">
                <h3>{entry.outfit}</h3>
                <p><AiOutlineCalendar className="icon" /> {entry.date}</p>
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
