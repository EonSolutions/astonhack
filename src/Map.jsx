import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const MapView = () => {
  const [position, setPosition] = useState([
    52.48699397560638, -1.8902491470592893,
  ]);

  if (!position) return <div>Loading current location...</div>;

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
    </MapContainer>
  );
};

export default MapView;
