import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ChatBot.css";
import { getAllCategories } from "./lib/categories";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ChatBotPage() {
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial prompts to engage the user
  const initialPrompts = [
    "What can I help with?",
    "Need outfit inspiration?",
    "Want to style your wardrobe?", 
    "Looking for fashion advice?",
    "Ask me anything about your wardrobe!",
  ];

  // New prompts after the user sends a message
  const postMessagePrompts = [
    "Great choice! Need more ideas?",
    "Inspired yet? Ask me anything!",
    "Your wardrobe is looking amazing!",
    "Let’s find the perfect fit for you!",
    "I love helping with fashion tips!",
  ];

  const [currentPrompt, setCurrentPrompt] = useState(initialPrompts[0]);
  const [fade, setFade] = useState(true);
  const [userHasSentMessage, setUserHasSentMessage] = useState(false);

  useEffect(() => {
    (async () => {
      const [items, _] = await getAllCategories();
      setWardrobe(items.map(({ id, name }) => [id, name]));
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

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        const randomIndex = Math.floor(
          Math.random() *
            (userHasSentMessage
              ? postMessagePrompts.length
              : initialPrompts.length)
        );
        setCurrentPrompt(
          userHasSentMessage
            ? postMessagePrompts[randomIndex]
            : initialPrompts[randomIndex]
        );
        setFade(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [userHasSentMessage]);

  const wardrobeStr = wardrobe
    .map(([id, desc]) => `${id} | ${desc}`)
    .join("\n");

    const handleSend = async () => {
      if (input.trim()) {
        setMessages((prev) => [...prev, { text: input, sender: "user" }]);
        setUserHasSentMessage(true);
        setInput("");
        setLoading(true);
    
        setTimeout(async () => {
          try {
            let formattedMessage = input;
    
            // If the input is very short, treat it as a context prompt
            if (input.trim().split(" ").length <= 3) {
              formattedMessage = `Suggest an outfit for: ${input}`;
            }
    
            const response = await fetch("http://localhost:5000/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ message: formattedMessage, wardrobe: wardrobeStr }),
            });
    
            const data = await response.json();
            let recommendation = data.recommendation;
            let r = data.reply;
            let recommended_items = [];
            console.log(data);
    
            if (recommendation && recommendation.length > 0) {
              try {
                const args = JSON.parse(recommendation[0].function.arguments);
                r ||= args.message;
    
                const [allItems, allCategories] = await getAllCategories();
                recommended_items = args.recommendation
                  .map((id) => allItems.find((item) => item.id === id))
                  .filter(Boolean);
              } catch (error) {
                console.error("Error parsing recommendation data:", error);
              }
            }
    
            const botMessage = {
              text: r || "I'm not sure what to suggest, but feel free to ask again!",
              sender: "bot",
              suggestion: recommended_items,
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
        }, 2000);
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
        <h2 className={`chatbot-prompt ${fade ? "fade-in" : "fade-out"}`}>
          {currentPrompt}
        </h2>
      </div>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chatbot-message ${
              message.sender === "user" ? "user-message" : "bot-message"
            }`}
          >
            {message.text}
            {message.suggestion && (
              <ul className="outfit-list">
                {message.suggestion.map((item) => (
                  <div key={item.id} className="outfit-item">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="outfit-image"
                    />
                    <div className="outfit-info">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </ul>
            )}
          </div>
        ))}
        {loading && (
          <div className="bot-typing">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <motion.div
        className="chatbot-input"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 50 }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          <FaPaperPlane />
        </button>
      </motion.div>
    </div>
  );
}
