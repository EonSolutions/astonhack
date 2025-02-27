import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { AiOutlineCloudUpload, AiOutlineCamera } from "react-icons/ai";
import { db } from "./lib/firebase";
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import "./App.css";
import ChatBotPage from "./ChatBot";
import { getAllCategories } from "./lib/categories";
import MapPage from "./Map";
import BottomNavbar from "./BottomNavbar";

const loadingPrompts = [
  "Loading your wardrobe..."
];

export default function App() {
  const [loadingPrompt, setLoadingPrompt] = useState(loadingPrompts[0]);
  const [fade, setFade] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("long_sleeve_top");
  const [items, setItems] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadClosing, setIsUploadClosing] = useState(false);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState([]);
  const [showAddedItemsModal, setShowAddedItemsModal] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Check localStorage for added items on app load
    const storedItems = JSON.parse(localStorage.getItem("addedItems"));
    if (storedItems && storedItems.length > 0) {
      setAddedItems(storedItems);
      setShowAddedItemsModal(true);
    }
  }, []);

  const handleOpenCamera = async () => {
    console.log("Attempting to open camera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // console.log("Camera stream accessed successfully", stream);

      setShowCameraPopup(true);

      // Ensure the video element updates properly
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              .play()
              .catch((error) => console.error("Error playing video:", error));
          };
          // console.log("Video stream set to videoRef and playing.");
        }
        setVideoStream(stream);
      }, 200); // Small delay to ensure popup is fully mounted
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Error accessing camera: " + error.message);
    }
  };

  const AddedItemsModal = ({ addedItems, onClose }) => {
    const handleClose = () => {
      localStorage.removeItem("addedItems"); // Clear localStorage
      onClose(); // Close the modal
    };

    return (
      <div className="popup-overlay">
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>
          <h3>Items Added Successfully!</h3>
          <ul className="outfit-list">
            {addedItems.map((item) => (
              <div key={item.id} className="outfit-item">
                <img
                  src={item.image}
                  alt={item.name}
                  className="outfit-image"
                />
                <div className="outfit-info">
                  <h3>{item.name}</h3> <p>{item.description}</p>
                </div>
              </div>
            ))}
          </ul>
          <button className="close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    );
  };

  const handleTakePhoto = () => {
    console.log("📸 Capturing photo...");

    if (!videoRef.current || !canvasRef.current) {
      console.warn("⚠️ Video or Canvas element not found!");
      return;
    }

    setIsProcessing(true); // Show loading animation

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    console.log("✅ Photo captured and drawn onto canvas.");

    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.warn("⚠️ Failed to capture photo as blob.");
        setIsProcessing(false);
        return;
      }

      console.log("🔄 Uploading photo to imgBB...");

      const formData = new FormData();
      formData.append("image", blob);

      try {
        // Upload image to imgBB
        const imgBBResponse = await fetch(
          `https://api.imgbb.com/1/upload?key=${
            import.meta.env.VITE_IMGBB_KEY
          }`,
          {
            method: "POST",
            body: formData,
          }
        );

        const imgBBData = await imgBBResponse.json();

        if (imgBBData.success) {
          const imageUrl = imgBBData.data.url;
          console.log("✅ Image uploaded to imgBB:", imageUrl);

          // Store the image URL in Firestore
          await addDoc(collection(db, "shirts"), { image: imageUrl });
          console.log("✅ Photo URL saved to Firestore database.");

          // Send image to Flask for processing
          const flaskResponse = await fetch(
            "http://127.0.0.1:5000/process_image",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image_url: imageUrl }),
            }
          );

          const flaskData = await flaskResponse.json();
          console.log("✅ Flask Response:", flaskData);

          // Wait 100ms
          await new Promise((resolve) => setTimeout(resolve, 100));

          const [allItems, allCategories] = await getAllCategories();

          setItems(allItems);
          setCategories(allCategories);
          setSelectedCategory(allCategories[0] || "");
          setLoading(false); // Data fetching is complete

          if (flaskData.type === "success") {
            setAddedItems(
              flaskData.results.map((i) =>
                allItems.find((c) => c.id === i.itemid)
              )
            );
          }

          // Show success message
          setShowSuccess(true);
          setShowPopup(false);
          setShowAddedItemsModal(true);

          // setTimeout(() => {
          //   setShowSuccess(false);
          //   window.location.reload();
          // }, 1500); // Refresh after animation ends
        } else {
          console.error("❌ Error uploading to imgBB:", imgBBData);
        }
      } catch (error) {
        console.error("❌ Error:", error);
      } finally {
        setIsProcessing(false); // Stop loading animation
      }
    }, "image/jpeg");
  };

  const handleUploadPhoto = async (event) => {
    const file = event.target.files[0]; // Get the selected file
    if (!file) {
      console.warn("⚠️ No file selected!");
      return;
    }

    setIsProcessing(true); // Show loading animation

    const formData = new FormData();
    formData.append("image", file);

    try {
      // Upload image to imgBB
      const imgBBResponse = await fetch(
        `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const imgBBData = await imgBBResponse.json();

      if (imgBBData.success) {
        const imageUrl = imgBBData.data.url;
        console.log("✅ Image uploaded to imgBB:", imageUrl);

        // Store the image URL in Firestore
        const newItem = {
          id: new Date().getTime().toString(), // Generate a unique ID
          name: "New Outfit", // Default name
          description: "Added via file upload", // Default description
          image: imageUrl,
        };

        await addDoc(collection(db, "shirts"), newItem);
        console.log("✅ Photo URL saved to Firestore database.");

        // Save the added item to localStorage
        const existingItems =
          JSON.parse(localStorage.getItem("addedItems")) || [];
        const updatedItems = [...existingItems, newItem];
        localStorage.setItem("addedItems", JSON.stringify(updatedItems));

        // Send image to Flask for processing
        const flaskResponse = await fetch(
          "http://127.0.0.1:5000/process_image",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: imageUrl }),
          }
        );

        const flaskData = await flaskResponse.json();
        console.log("✅ Flask Response:", flaskData);

        // Show success message
        setShowSuccess(true);
        setShowPopup(false);

        // Immediately show the loading component
        setIsProcessing(true);

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 10000); // Small delay to ensure the loading component is visible
      } else {
        console.error("❌ Error uploading to imgBB:", imgBBData);
      }
    } catch (error) {
      console.error("❌ Error:", error);
    } finally {
      setIsProcessing(false); // Stop loading animation
    }
  };

  const closePopup = () => {
    setIsUploadClosing(true);
    setTimeout(() => {
      setShowPopup(false);
      setIsUploadClosing(false);
    }, 300); // Match animation duration
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length) {
      console.log("Files dropped:", files);
    }
  };

  const LoadingComponent = () => (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className={`loading-text ${fade ? "fade-in" : "fade-out"}`}>
          {loadingPrompt}
        </p>
      </div>
    </div>
  );

  useEffect(() => {
    if (addedItems.length > 0) {
      setShowAddedItemsModal(true);
    }
  }, [addedItems]);

  useEffect(() => {
    const fetchAllCollections = async () => {
      const [allItems, allCategories] = await getAllCategories();

      setItems(allItems);
      setCategories(allCategories);
      setSelectedCategory(allCategories[0] || "");
      setLoading(false); // Data fetching is complete
    };

    fetchAllCollections();
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="wardrobe-container">
              {/* Show loading component if processing or refreshing */}
              {(loading || isProcessing) && <LoadingComponent />}

              {!loading && !isProcessing && (
                <>
                  <header className="wardrobe-header">RE:STYLE</header>

                  <div className="main-content">
                    <div className="category-buttons">
                      {categories.map((category) => (
                        <button
                          key={category}
                          className={`category-btn ${
                            selectedCategory === category ? "active" : ""
                          }`}
                          onClick={() => setSelectedCategory(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    {items.length > 0 ? (
                      <div className="item-grid">
                        {items
                          .filter((item) => item.category === selectedCategory)
                          .map((item) => (
                            <div className="item-card" key={item.id}>
                              <div className="item-image-container">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="item-image"
                                />
                              </div>

                              <h3 className="item-title">{item.name}</h3>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="empty-category">
                        <p>No items in this category</p>
                      </div>
                    )}
                  </div>

                  <BottomNavbar hasMiddle={true} setShowPopup={setShowPopup} />

                  {showPopup && (
                    <div
                      className={`popup-overlay ${
                        isUploadClosing ? "closing" : ""
                      }`}
                      onClick={closePopup}
                    >
                      <div
                        className={`popup-content ${
                          isUploadClosing ? "closing" : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className={`upload-box ${
                            isDragging ? "dragging" : ""
                          }`}
                          onDragEnter={handleDragStart}
                          onDragOver={handleDragStart}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <AiOutlineCloudUpload className="upload-icon" />
                          <p className="upload-text">
                            Drag & drop your files here or
                          </p>
                          <button
                            className="upload-btn"
                            onClick={() =>
                              document.getElementById("file-input").click()
                            }
                          >
                            Choose files
                          </button>
                          <input
                            id="file-input"
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleUploadPhoto}
                          />
                        </div>

                        {/* Take Photo Button */}
                        <button
                          className="take-photo-btn"
                          onClick={handleOpenCamera}
                        >
                          <AiOutlineCamera className="camera-icon" /> Take a
                          Photo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Camera Popup */}
                  {showCameraPopup && (
                    <div
                      className="popup-overlay"
                      onClick={() => setShowCameraPopup(false)}
                    >
                      <div className="camera-popup">
                        <video
                          ref={videoRef}
                          className="camera-preview"
                          autoPlay
                          playsInline
                        ></video>
                        <canvas
                          ref={canvasRef}
                          width="300"
                          height="200"
                          style={{ display: "none" }}
                        ></canvas>
                        <button className="popup-btn" onClick={handleTakePhoto}>
                          Capture Photo
                        </button>
                        <button
                          className="close-btn"
                          onClick={() => setShowCameraPopup(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="loading-overlay">
                      <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Processing image...</p>
                      </div>
                    </div>
                  )}

                  {showAddedItemsModal && (
                    <AddedItemsModal
                      addedItems={addedItems}
                      onClose={() => setShowAddedItemsModal(false)}
                    />
                  )}
                </>
              )}
            </div>
          }
        />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<ChatBotPage />} />
      </Routes>
    </Router>
  );
}
