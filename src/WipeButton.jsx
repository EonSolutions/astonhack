import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CircularWipeButton = () => {
  const [animateCircle, setAnimateCircle] = useState(false);

  const handleClick = () => {
    setAnimateCircle(true);
    setTimeout(() => setAnimateCircle(false), 1000); // Reset after animation
  };

  return (
    <div className="relative h-screen w-full flex items-center justify-center bg-gray-100 overflow-hidden">
      <button
        onClick={handleClick}
        className="relative z-10 px-6 py-3 text-white bg-blue-600 rounded-full text-lg shadow-lg hover:bg-blue-700 transition"
      >
        Click Me
      </button>

      <AnimatePresence>
        {animateCircle && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 20, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute z-0 w-10 h-10 bg-blue-600 rounded-full"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CircularWipeButton;