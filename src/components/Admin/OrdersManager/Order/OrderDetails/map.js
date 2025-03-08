
"use client";
import React, { useEffect, useState } from "react";

export default function Map({ order }) {
    const [latLng, setLatLng] = useState(null);
    const address = order?.shippingAddress || "";

    useEffect(() => {
        if (!address) return;

        // Llamamos a la API pública de Nominatim para buscar lat/lng de la dirección
        const geocodeAddress = async () => {
            try {
                const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
                const resp = await fetch(url);
                const data = await resp.json();

                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    // Guardamos lat/lng como números
                    setLatLng({ lat: parseFloat(lat), lng: parseFloat(lon) });
                } else {
                    console.warn("No se encontraron coordenadas para la dirección:", address);
                }
            } catch (error) {
                console.error("Error al geocodificar:", error);
            }
        };

        geocodeAddress();
    }, [address]);

    return (
        <div className="order-card">
            <h3>Dirección de entrega</h3>
            <p>{address}</p>

            {/* Si ya tenemos lat/lng, mostramos el mapa fijo */}
            {latLng ? (
                <iframe
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    loading="lazy"
                    // Llamamos a la URL pública de Google Maps pasando lat y lng
                    src={`https://www.google.com/maps?q=${latLng.lat},${latLng.lng}&z=16&output=embed`}
                />
            ) : (
                <p>Cargando mapa...</p>
            )}
        </div>
    );
}

