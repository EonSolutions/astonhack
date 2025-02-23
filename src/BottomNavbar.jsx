import React from "react";
import { AiOutlineHome, AiOutlineBarChart, AiOutlinePlus, AiOutlineUser, AiOutlineMessage } from "react-icons/ai";
import { Link } from "react-router-dom";
import "./BottomNavbar.css"; // Ensure you have the CSS file

const BottomNavbar = ({ setShowPopup }) => {
  return (
    <div className="bottom-navbar">
      <button className="nav-btn" onClick={() => (window.location.href = "http://localhost:5173/")}>
        <AiOutlineHome size={30} />
      </button>
      <Link to="/chat" className="nav-btn">
        <AiOutlineMessage size={30} />
      </Link>
      <button className="nav-btn" onClick={() => setShowPopup(true)}>
        <AiOutlinePlus size={30} />
      </button>
      <Link to="/dashboard" className="nav-btn">
        <AiOutlineBarChart size={30} />
      </Link>
      <Link to="/profile" className="nav-btn">
        <AiOutlineUser size={30} />
      </Link>
    </div>
  );
};

export default BottomNavbar;
