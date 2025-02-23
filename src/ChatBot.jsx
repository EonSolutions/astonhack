import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./ChatBot.css";
import { getAllCategories } from "./lib/categories";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa"; // Import Icons

export default function ChatBotPage() {
  const navigate = useNavigate(); // Initialize navigation hook
  const [wardrobe, setWardrobe] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [items, _] = await getAllCategories();
      setWardrobe(items.map(({ id, description }) => [id, description]));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      await fetch("http://localhost:5000/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
    })();
  }, []);

  const wardrobeStr = wardrobe.map(([id, desc]) => `${id} | ${desc}`).join("\n");

  const handleSend = async () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { text: input, sender: "user" }]);
      setInput("");
      setLoading(true);

      try {
        const response = await fetch("http://localhost:5000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: input, wardrobe: wardrobeStr }),
        });

        const data = await response.json();
        const recommendation = data.recommendation;
        let r = data.response;
        if (recommendation.length > 0) {
            const args = JSON.parse(recommendation[0].function.arguments);
            r ||= args.message
            const recommended_items = args.recommendation
        }
        const botMessage = { text: r || "No response from bot.", sender: "bot" };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Error fetching bot response:", error);
        setMessages((prev) => [...prev, { text: "Error connecting to the bot.", sender: "bot" }]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <button className="back-button" onClick={() => navigate("/")}>
          <FaArrowLeft />
        </button>
        <h2>AI Stylist</h2>
      </div>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`chatbot-message ${message.sender === "user" ? "user-message" : "bot-message"}`}>
            {message.text}
          </div>
        ))}
        {loading && <div className="bot-message">Bot is typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbot-input">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type a message..." disabled={loading} />
        <button onClick={handleSend} disabled={loading}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}