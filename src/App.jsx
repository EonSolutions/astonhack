import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { AiOutlineHome, AiOutlinePlus, AiOutlineUser, AiOutlineMessage, AiOutlineCloudUpload, AiOutlineCamera, AiOutlineBarChart } from "react-icons/ai";
import { db } from "./lib/firebase";
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import "./App.css";

const formatCategoryName = (category) => {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const fetchCollections = async () => {
  try {
    const snapshot = await getDocs(collection(db, "Collections")); // Replace with the actual collection name
    const dbCategories = snapshot.docs.map(doc => doc.id); // Extracts document IDs

    const formattedCategories = dbCategories.map(formatCategoryName);

    return formattedCategories;
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
};

// Call this function where needed (e.g., inside a React component)
fetchCollections().then(formattedCategories => {
  console.log("Collections Array:", formattedCategories);
});


export default function App() {

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("long_sleeve_top");
  const [items, setItems] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadClosing, setIsUploadClosing] = useState(false);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const toggleDescription = (itemId) => {
    setExpandedDescriptions((prevState) => ({
      ...prevState,
      [itemId]: !prevState[itemId], // Toggle state for each item
    }));
  };

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
            videoRef.current.play().catch(error => console.error("Error playing video:", error));
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
        const imgBBResponse = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`, {
          method: "POST",
          body: formData,
        });

        const imgBBData = await imgBBResponse.json();

        if (imgBBData.success) {
          const imageUrl = imgBBData.data.url;
          console.log("✅ Image uploaded to imgBB:", imageUrl);

          // Store the image URL in Firestore
          await addDoc(collection(db, "shirts"), { image: imageUrl });
          console.log("✅ Photo URL saved to Firestore database.");

          // Send image to Flask for processing
          const flaskResponse = await fetch("http://127.0.0.1:5000/process_image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_url: imageUrl })
          });

          const flaskData = await flaskResponse.json();
          console.log("✅ Flask Response:", flaskData);

          // Show success message
          setShowSuccess(true);
          setShowPopup(false);
          setTimeout(() => {
            setShowSuccess(false);
            window.location.reload(); 
          }, 1500); // Refresh after animation ends

          alert("✅ Photo uploaded and processed successfully!");
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


  const handleUploadPhoto = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.click();
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

  useEffect(() => {
    const fetchAllCollections = async () => {
      let allItems = [];
      let allCategories = [];

      const formattedCategories = await fetchCollections();

      for (const formattedCategory of formattedCategories) {
        try {
          // 🔹 Convert formatted name back to Firestore-friendly format (underscores)
          const firestoreCategory = formattedCategory.toLowerCase().replace(/\s/g, "_");

          const querySnapshot = await getDocs(collection(db, firestoreCategory));

          const collectionItems = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            category: formattedCategory, // ✅ Use formatted name in UI
            name: doc.data().name || "Unnamed Item",
            description: doc.data().description || "No description available",
            colour: doc.data().colour || "Unknown",
            image: doc.data().image || "",
          }));

          if (collectionItems.length > 0) {
            allCategories.push(formattedCategory); // ✅ Keep formatted categories
          }

          allItems = [...allItems, ...collectionItems];
        } catch (error) {
          console.error(`Error fetching collection ${formattedCategory}:`, error);
        }
      }

      setItems(allItems);
      setCategories(allCategories);
      setSelectedCategory(allCategories[0] || "");
    };

    fetchAllCollections();
  }, []);


  useEffect(() => {
    const fetchAndSetCategories = async () => {
      const formattedCategories = await fetchCollections();
      console.log("✅ Final Categories:", formattedCategories); // Debugging

      if (formattedCategories.length > 0) {
        setCategories(formattedCategories); // ✅ Ensure categories are set
        setSelectedCategory(formattedCategories[0]); // ✅ Set first category as default
      }
    };

    fetchAndSetCategories();
  }, []);


  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="wardrobe-container">

            <header className="wardrobe-header">My Wardrobe</header>

            <div className="main-content">
              <div className="category-buttons">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? "active" : ""}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category} {/* 🔹 Already formatted */}
                  </button>
                ))}
              </div>

              {items.length > 0 ? (
                <div className="item-grid">
                  {items
                    .filter((item) => item.category === selectedCategory)
                    .map((item) => (
                      <div className="item-card">
                        <div className="item-image-container">
                          <img src={item.image} alt={item.name} className="item-image" />
                        </div>

                        <h3 className="item-title">{item.name}</h3>

                        <div className="item-description">
                          {item.description.split(" ").length > 10 ? (
                            <div>
                              {!expandedDescriptions[item.id] ? (
                                <p>{item.description.split(" ").slice(0, 10).join(" ")}...</p>
                              ) : (
                                <p>{item.description}</p>
                              )}

                              <button
                                className="see-description-btn"
                                onClick={() => toggleDescription(item.id)}
                              >
                                {expandedDescriptions[item.id] ? "Hide Description" : "See Description"}
                              </button>
                            </div>
                          ) : (
                            <p>{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="empty-category">
                  <p>No items in this category</p>
                </div>
              )}
            </div>

            <div className="bottom-navbar">
              <button className="nav-btn"><AiOutlineHome size={30} /></button>
              <button className="nav-btn"><AiOutlineMessage size={30} /></button>
              <button className="nav-btn" onClick={() => setShowPopup(true)}><AiOutlinePlus size={30} /></button>
              <Link to="/dashboard" className="nav-btn"><AiOutlineBarChart size={30} /></Link>
              <Link to="/profile" className="nav-btn"><AiOutlineUser size={30} /></Link>
            </div>

            {showPopup && (
              <div className={`popup-overlay ${isUploadClosing ? "closing" : ""}`} onClick={closePopup}>
                <div className={`popup-content ${isUploadClosing ? "closing" : ""}`} onClick={(e) => e.stopPropagation()}>
                  <div
                    className={`upload-box ${isDragging ? "dragging" : ""}`}
                    onDragEnter={handleDragStart}
                    onDragOver={handleDragStart}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <AiOutlineCloudUpload className="upload-icon" />
                    <p className="upload-text">Drag & drop your files here or</p>
                    <button className="upload-btn">Choose files</button>
                  </div>

                  {/* Take Photo Button */}
                  <button className="take-photo-btn" onClick={handleOpenCamera}>
                    <AiOutlineCamera className="camera-icon" /> Take a Photo
                  </button>
                </div>
              </div>
            )}

            {/* Camera Popup */}
            {showCameraPopup && (
              <div className="popup-overlay" onClick={() => setShowCameraPopup(false)}>
                <div className="camera-popup">
                  <video ref={videoRef} className="camera-preview" autoPlay playsInline></video>
                  <canvas ref={canvasRef} width="300" height="200" style={{ display: "none" }}></canvas>
                  <button className="popup-btn" onClick={handleTakePhoto}>Capture Photo</button>
                  <button className="close-btn" onClick={() => setShowCameraPopup(false)}>Close</button>
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

            {showSuccess && (
              <div className="success-toast">
                ✅ Your outfit has been added!
              </div>
            )}
          </div>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}