import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FiClock } from "react-icons/fi";
import { FaRegStar } from "react-icons/fa";
import "./Map.css"; // Import the CSS file for styling
import BottomNavbar from "./BottomNavbar";

const MapView = () => {
  const [position, setPosition] = useState([
    52.48699397560638, -1.8902491470592893,
  ]);

  if (!position) return <div>Loading current location...</div>;

  const [charityShops, setCharityShops] = useState([]);

  useEffect(() => {
    if (position) {
      const fetchCharityShops = async () => {
        const [lat, lng] = position;

        try {
          const url = `http://localhost:5000/get-charity-shops?lat=${lat}&lng=${lng}`;
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          });

          // 4. Handle HTTP errors first
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.results) {
            setCharityShops(data.results);
          } else {
            console.error("No charity shops found or error fetching data");
          }
        } catch (error) {
          console.error("Error fetching charity shops:", error);
        }
      };

      fetchCharityShops();
    }
  }, [position]);

  console.log(charityShops);

  return (
    <>
      <header className="wardrobe-header">Sell My Clothes</header>
      <BottomNavbar hasMiddle={false} setShowPopup={undefined}/>
      <div
        className="map-container"
        style={{
          backgroundColor: "#f5f5f5",
          height: "calc(100vh - 70px)",
          marginTop: "70px",
        }}
      >
        <div className="sidebar">
          {charityShops.map((shop, i) => (
            <a
              key={i}
              href={`https://www.google.com/maps/search/?api=1&query=${shop.geometry.location.lat},${shop.geometry.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shop-card"
            >
              {shop.photos && shop.photos.length > 0 && (
                <img
                  src={`https://maps.googleapis.com/maps/api/place/photo?photoreference=${
                    shop.photos[0].photo_reference
                  }&sensor=false&maxheight=200&maxwidth=200&key=${
                    import.meta.env.VITE_GOOGLE_KEY
                  }`}
                  alt={shop.name}
                  className="shop-image"
                />
              )}
              <div className="shop-info">
                <h3>{shop.name}</h3>
                <p>
                  <FiClock style={{ marginRight: "4px" }} />
                  {shop.opening_hours ? (
                    <>Open now: {shop.opening_hours.open_now ? "Yes" : "No"}</>
                  ) : (
                    <>Opening times not available</>
                  )}
                </p>
                <p>
                  <FaRegStar style={{ marginRight: "4px" }} />
                  {shop.rating ? (
                    <>{shop.rating} Stars</>
                  ) : (
                    <>Rating not available</>
                  )}
                </p>
              </div>
            </a>
          ))}
        </div>
        <div
          style={{
            position: "relative",
            width: "calc(100vw - 300px)",
            height: "100%",
          }}
        >
          <MapContainer
            center={position}
            zoom={13}
            maxZoom={18} // Set maximum zoom level
            minZoom={10} // Set minimum zoom level
            style={{
              position: "absolute",
              top: "50px",
              right: "50px",
              bottom: "50px",
              left: "50px",
              borderRadius: "40px",
              boxShadow: "0 0 10px rgba(0, 0, 0, 0.3)",
            }}
            zoomControl={false} // Hide zoom controls
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            />
            <CircleMarker
              center={position}
              radius={8} // Size of the circle
              pathOptions={{
                fillColor: "#4287f5", // Fill color (inside the circle)
                color: "#333", // Border color
                weight: 2, // Border width
                opacity: 1, // Border opacity
                fillOpacity: 1, // Fill opacity
              }}
            >
              <Popup>You are here.</Popup>
            </CircleMarker>
            {charityShops ? (
              charityShops.map((shop, i) => (
                <CircleMarker
                  key={i}
                  center={[
                    shop.geometry.location.lat,
                    shop.geometry.location.lng,
                  ]}
                  radius={8} // Size of the circle
                  pathOptions={{
                    fillColor: "#28c953", // Fill color (inside the circle)
                    color: "#333", // Border color
                    weight: 2, // Border width
                    opacity: 1, // Border opacity
                    fillOpacity: 1, // Fill opacity
                  }}
                >
                  <Popup>
                    <div style={{ marginBottom: "4px", maxWidth: "200px" }}>
                      <strong>{shop.name}</strong>
                    </div>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <FiClock style={{ marginRight: "4px" }} />
                      {shop.opening_hours ? (
                        <>
                          Open now: {shop.opening_hours.open_now ? "Yes" : "No"}
                        </>
                      ) : (
                        <>Opening times not available</>
                      )}
                    </span>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <FaRegStar style={{ marginRight: "4px" }} />
                      {shop.rating ? (
                        <>{shop.rating} Stars</>
                      ) : (
                        <>Rating not available</>
                      )}
                    </span>
                  </Popup>
                </CircleMarker>
              ))
            ) : (
              <p>Loading charity shops...</p>
            )}
          </MapContainer>
        </div>
      </div>
    </>
  );
};

export default MapView;
