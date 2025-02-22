import React from "react";
import { AiOutlineHeart, AiOutlineSetting, AiOutlineLogout, AiOutlineGift, AiOutlineUser, AiOutlineMessage } from "react-icons/ai";
import "./Profile.css";

export default function ProfilePage() {
  return (
    <div className="profile-container">
      <h2 className="profile-title">My Profile</h2>

      <div className="profile-options">
        <button className="profile-btn">
          <AiOutlineGift className="icon" /> My Offers
        </button>
        <button className="profile-btn">
          <AiOutlineHeart className="icon" /> Wishlist
        </button>
        <button className="profile-btn">
          <AiOutlineSetting className="icon" /> Settings
        </button>
        <button className="profile-btn">
          <AiOutlineUser className="icon" /> User Management
        </button>
        <button className="profile-btn">
          <AiOutlineMessage className="icon" /> Support
        </button>
        <button className="profile-btn logout">
          <AiOutlineLogout className="icon" /> Logout
        </button>
      </div>
    </div>
  );
}