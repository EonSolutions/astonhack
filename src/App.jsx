import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { AiOutlineHome, AiOutlinePlus, AiOutlineUser, AiOutlineMessage, AiOutlineCloudUpload, AiOutlineCamera, AiOutlineBarChart } from "react-icons/ai";
import { db } from "./lib/firebase";
import Profile from "./Profile";
import Dashboard from "./Dashboard";
import "./App.css";

const fetchCollections = async () => {
  try {
    const snapshot = await getDocs(collection(db, "Collections")); // Replace with the actual collection name
    const dbCategories = snapshot.docs.map(doc => doc.id); // Extracts document IDs

    console.log("Fetched Collections:", dbCategories);
    return dbCategories;
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
};

// Call this function where needed (e.g., inside a React component)
fetchCollections().then(dbCategories => {
  console.log("Collections Array:", dbCategories);
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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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
    console.log("Capturing photo...");
  
    if (!videoRef.current || !canvasRef.current) {
      console.warn("Video or Canvas element not found!");
      return;
    }
  
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    console.log("Photo captured and drawn onto canvas.");
  
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.warn("Failed to capture photo as blob.");
        return;
      }
  
      console.log("Uploading photo to imgBB...");
  
      const formData = new FormData();
      formData.append("image", blob);
  
      try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_KEY}`, {
          method: "POST",
          body: formData,
        });
  
        const data = await response.json();
        if (data.success) {
          const imageUrl = data.data.url;
          console.log("Image URL:", imageUrl);
  
          await addDoc(collection(db, "shirts"), { image: imageUrl });
          console.log("Photo URL saved to Firestore database.");
  
          alert("Photo uploaded successfully!");
        } else {
          console.error("Error uploading to imgBB:", data);
        }
      } catch (error) {
        console.error("Error:", error);
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

      const dbCategories = await fetchCollections();

      for (const collectionName of dbCategories) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));

          const collectionItems = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            category: collectionName,
            name: doc.data().name || "Unnamed Item",
            description: doc.data().description || "No description available",
            colour: doc.data().colour || "Unknown",
            image: doc.data().image || "",
          }));

          if (collectionItems.length > 0) {
            allCategories.push(collectionName);
          }

          allItems = [...allItems, ...collectionItems];
        } catch (error) {
          console.error(`Error fetching collection ${collectionName}:`, error);
        }
      }

      setItems(allItems);
      setCategories(allCategories);
      setSelectedCategory(allCategories[0] || "");
    };

    fetchAllCollections();
  }, []);

  useEffect(() => {
    (async () => {
      setCategories(await fetchCollections());
    })();
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
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>

              {items.length > 0 ? (
                <div className="item-grid">
                  {items
                    .filter((item) => item.category === selectedCategory)
                    .map((item) => (
                      <div key={item.id} className="item-card">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="item-image" />
                        ) : (
                          <div className="placeholder">No Image</div>
                        )}
                        <div className="item-info">
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
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
          </div>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}