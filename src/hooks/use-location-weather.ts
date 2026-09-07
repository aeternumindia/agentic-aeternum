"use client";

import { useState, useEffect } from "react";

export interface LocationWeatherData {
  city: string;
  country: string;
  tempC: number;
  condition: string;
  icon: string;
  stylistNote: string;
  promptText: string;
  isLoading: boolean;
}

export function useLocationWeather(): LocationWeatherData {
  const [data, setData] = useState<LocationWeatherData>({
    city: "Mumbai",
    country: "India",
    tempC: 28,
    condition: "Sunny & Warm",
    icon: "☀️",
    stylistNote: "Warm 28°C climate in Mumbai. We recommend breathable linen shirts and lightweight cotton trousers.",
    promptText: "Find lightweight outfits for 28°C in Mumbai",
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchWeather(lat: number, lon: number, cityName: string, countryName: string) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const json = await res.json();
        const temp = Math.round(json.current_weather?.temperature ?? 28);
        const code = json.current_weather?.weathercode ?? 0;

        let condition = "Clear";
        let icon = "☀️";
        if (code > 0 && code <= 3) {
          condition = "Partly Cloudy";
          icon = "🌤️";
        } else if (code >= 45 && code <= 48) {
          condition = "Foggy";
          icon = "🌫️";
        } else if (code >= 51 && code <= 67) {
          condition = "Rainy";
          icon = "🌧️";
        } else if (code >= 71) {
          condition = "Cool / Snow";
          icon = "❄️";
        } else if (temp >= 30) {
          condition = "Hot & Sunny";
          icon = "☀️";
        } else if (temp >= 22) {
          condition = "Pleasant & Warm";
          icon = "🌤️";
        } else {
          condition = "Cool Breeze";
          icon = "🍃";
        }

        let stylistNote = "";
        let promptText = "";

        if (temp >= 26) {
          stylistNote = `Warm ${temp}°C weather in ${cityName}. Lightweight linen shirts, polos, and breathable trousers provide optimal luxury comfort.`;
          promptText = `Recommend breathable linen & polo outfits for ${temp}°C in ${cityName}`;
        } else if (temp >= 18) {
          stylistNote = `Pleasant ${temp}°C in ${cityName}. Ideal for smart-casual shirts, tailored overshirts, and cotton trousers.`;
          promptText = `Show smart casual layered outfits for ${temp}°C in ${cityName}`;
        } else {
          stylistNote = `Cool ${temp}°C weather in ${cityName}. Layer with structured blazers, jackets, and premium outerwear.`;
          promptText = `Recommend jackets and layered outerwear for ${temp}°C in ${cityName}`;
        }

        if (isMounted) {
          setData({
            city: cityName,
            country: countryName,
            tempC: temp,
            condition,
            icon,
            stylistNote,
            promptText,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error("Open-Meteo weather fetch error:", err);
        if (isMounted) {
          setData((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    // IP Geolocation fallback if GPS denied/unsupported
    async function fetchIpLocation() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const json = await res.json();
        if (json.latitude && json.longitude) {
          await fetchWeather(
            json.latitude,
            json.longitude,
            json.city || "Mumbai",
            json.country_name || "India"
          );
        } else {
          // Default fallback
          await fetchWeather(19.076, 72.8777, "Mumbai", "India");
        }
      } catch {
        fetchWeather(19.076, 72.8777, "Mumbai", "India");
      }
    }

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            const geoJson = await geoRes.json();
            const city = geoJson.city || geoJson.locality || "Your Location";
            const country = geoJson.countryName || "India";
            await fetchWeather(lat, lon, city, country);
          } catch {
            await fetchWeather(lat, lon, "Your Location", "India");
          }
        },
        () => {
          // User denied or GPS error -> fallback to IP geolocation
          fetchIpLocation();
        },
        { timeout: 6000 }
      );
    } else {
      fetchIpLocation();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return data;
}
