import React, { useState } from "react";
import {
  AiOutlineHome,
  AiOutlineBarChart,
  AiOutlinePlus,
  AiOutlineUser,
  AiOutlineMessage,
  AiOutlineSkin,
} from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./BottomNavbar.css"; // Ensure your CSS is loaded

const BottomNavbar = ({ hasMiddle, setShowPopup }) => {
  const [animateCircle, setAnimateCircle] = useState(false);
  const navigate = useNavigate();

  // Handle chat button click to animate white overlay before redirecting
  const handleChatClick = (e) => {
    e.preventDefault(); // Prevent immediate navigation
    setAnimateCircle(true);
    // Wait for the animation to complete before navigating
    setTimeout(() => {
      navigate("/chat");
    }, 800); // Adjust if you change the animation duration
  };

  return (
    <div className="bottom-navbar">
      <button
        className="nav-btn"
        onClick={() => (window.location.href = "http://localhost:5173/")}
      >
        <AiOutlineHome size={30} />
      </button>

      {/* Chat button with white circular wipe animation */}
      <button className="nav-btn" onClick={handleChatClick}>
        <AiOutlineMessage size={30} />
      </button>
{/* Always show the shirt button on the dashboard */}
{hasMiddle || window.location.pathname === "/dashboard" ? (
  <Link to="/outfit" className="nav-btn"> 
    <AiOutlineSkin size={30} />
  </Link>
) : null}

{/* Show the plus button only if hasMiddle is true */}
{hasMiddle && (
  <button className="nav-btn" onClick={() => setShowPopup(true)}>
    <AiOutlinePlus size={30} />
  </button>
)}

      
      <Link to="/dashboard" className="nav-btn">
        <AiOutlineBarChart size={30} />
      </Link>
      
      <Link to="/profile" className="nav-btn">
        <AiOutlineUser size={30} />
      </Link>

      {/* Full-screen white animated circle */}
      <AnimatePresence>
        {animateCircle && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeIn" }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              width: 30,
              height: 30,
              backgroundColor: "#ffffff", // White color for the wipe
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 9999,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BottomNavbar;
