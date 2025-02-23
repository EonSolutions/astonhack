import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Popup,
  CircleMarker,
  Marker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GOOGLE_API_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

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
          console.log(data); // Log the response to check what you are receiving

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

  console.log(charityShops)

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
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
        <Marker
          key={i}
          position={{
            lat: shop.geometry.location.lat,
            lng: shop.geometry.location.lng,
          }}
        >
          <Popup>
            <strong>{shop.name}</strong>
            <br />
            {shop.opening_hours ? (
                <strong>Open now: {shop.opening_hours.open_now ? "Yes" : "No"}</strong>
            ) : (
              <p>Opening times not available</p>
            )}
          </Popup>
        </Marker>
      ))) : <p>Loading charity shops...</p>}
    </MapContainer>
  );
};

export default MapView;
