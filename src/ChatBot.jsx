import React, { useEffect, useState } from "react";
import "./ChatBot.css";
import { getAllCategories } from "./lib/categories";

export default function ChatBotPage() {
  const [wardrobe, setWardrobe] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [items, _] = await getAllCategories();

      // Create a wardrobe array with the item ID and description
      const wardrobe = items.map(({ id, description }) => [id, description]);
      setWardrobe(wardrobe);
    })();
  }, []);

  //   On page load, post RESET
  useEffect(() => {
    (async () => {
      await fetch("http://localhost:5000/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });
    })();
  }, []);

  const wardrobeStr = wardrobe
    .map(([id, desc]) => `${id} | ${desc}`)
    .join("\n");
  //   console.log(wardrobeStr);

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: "user" };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);

      try {
        const response = await fetch("http://localhost:5000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            message: input,
            wardrobe: wardrobeStr,
          }),
        });

        const data = await response.json();
        console.log(data);
        const botMessage = {
          text: data.response || "No response from bot.",
          sender: "bot",
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Error fetching bot response:", error);
        setMessages((prev) => [
          ...prev,
          { text: "Error connecting to the bot.", sender: "bot" },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chatbot-message ${
              message.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            {message.text}
          </div>
        ))}
        {loading && <div className="bot-message">Bot is typing...</div>}
      </div>
      <div className="chatbot-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
