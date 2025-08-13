// src/hooks/useAccurateLocation.ts
'use client';

import { useState, useCallback } from "react";

// --- Constants for Stage 1: High-Accuracy Attempt ---
const ACCURATE_LOCATION_TIMEOUT = 20000; // 20 seconds for the accurate attempt
const REQUIRED_ACCURACY = 50;   // Must be better (smaller) than 50 meters

// --- Constants for Stage 2: Fallback Attempt ---
const FALLBACK_LOCATION_TIMEOUT = 10000; // 10 seconds for the less accurate fallback

// Custom Error to identify a timeout specific to accuracy requirements
class AccuracyTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccuracyTimeoutError';
  }
}

/**
 * A hook to get a GPS location using a two-stage process.
 *
 * Stage 1: Tries to get a highly accurate location (better than 50m) within 20 seconds.
 * Stage 2: If Stage 1 fails due to a timeout, it falls back to a faster, less accurate request.
 *
 * This provides a good balance, prioritizing accuracy for capable devices (like phones)
 * while still providing a location for less capable devices (like laptops).
 *
 * @returns An object with:
 *  - `getLocation`: An async function that resolves with a position or rejects with an error.
 *  - `isGettingLocation`: A boolean indicating if the location is currently being fetched.
 */
export function useAccurateLocation() {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // --- Stage 1: The high-accuracy attempt ---
  const getAccurateLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      const watcherIds: { watchId?: number; timeoutId?: NodeJS.Timeout } = {};

      const clearWatchers = () => {
        if (watcherIds.watchId) navigator.geolocation.clearWatch(watcherIds.watchId);
        if (watcherIds.timeoutId) clearTimeout(watcherIds.timeoutId);
      };

      watcherIds.timeoutId = setTimeout(() => {
        clearWatchers();
        // Reject with a custom error so we can catch it specifically
        reject(new AccuracyTimeoutError(`Could not get a location with required accuracy (${REQUIRED_ACCURACY}m) within ${ACCURATE_LOCATION_TIMEOUT / 1000} seconds.`));
      }, ACCURATE_LOCATION_TIMEOUT);

      watcherIds.watchId = navigator.geolocation.watchPosition(
        (position) => {
          console.log(`[Stage 1] Received position update with accuracy: ${position.coords.accuracy}m`);
          if (position.coords.accuracy <= REQUIRED_ACCURACY) {
            console.log(`[Stage 1] Sufficient accuracy achieved: ${position.coords.accuracy}m. Resolving.`);
            clearWatchers();
            resolve(position);
          }
        },
        (err) => {
          clearWatchers();
          reject(new Error(`Geolocation Error: ${err.message}. Please ensure location services are enabled for this site.`));
        },
        {
          enableHighAccuracy: true,
          timeout: ACCURATE_LOCATION_TIMEOUT,
          maximumAge: 0,
        }
      );
    });
  };

  // --- Stage 2: The less-accurate fallback ---
  const getFallbackLocation = (): Promise<GeolocationPosition> => {
    console.log("[Stage 2] Accurate location failed. Falling back to a faster, less accurate request.");
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(`[Stage 2] Fallback successful. Accuracy: ${position.coords.accuracy}m`);
          resolve(position);
        },
        (err) => {
          reject(new Error(`Fallback Geolocation Error: ${err.message}.`));
        },
        {
          enableHighAccuracy: false, // The key change for the fallback
          timeout: FALLBACK_LOCATION_TIMEOUT,
          maximumAge: 60000, // Allow a slightly older cached position for speed
        }
      );
    });
  };


  const getLocation = useCallback(async (): Promise<GeolocationPosition> => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      setIsGettingLocation(false);
      throw new Error("Geolocation is not supported by your browser.");
    }

    try {
      // --- Attempt Stage 1 ---
      console.log("[Stage 1] Attempting to get an accurate location...");
      const accuratePosition = await getAccurateLocation();
      setIsGettingLocation(false);
      return accuratePosition;
    } catch (error) {
      // --- If Stage 1 fails, check the reason ---
      if (error instanceof AccuracyTimeoutError) {
        // The failure was a timeout on accuracy, so we proceed to Stage 2
        console.warn(error.message); // Log the warning
        try {
          // --- Attempt Stage 2 ---
          const fallbackPosition = await getFallbackLocation();
          setIsGettingLocation(false);
          return fallbackPosition;
        } catch (fallbackError) {
          // If the fallback also fails, then we give up.
          setIsGettingLocation(false);
          throw fallbackError;
        }
      } else {
        // The failure was something else (e.g., permissions denied), so we fail completely.
        setIsGettingLocation(false);
        throw error;
      }
    }
  }, []);

  return { getLocation, isGettingLocation };
}