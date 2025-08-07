// src/hooks/useAccurateLocation.ts
'use client';

import { useState, useCallback } from "react";

// Constants for a stricter, more patient process
const LOCATION_TIMEOUT = 40000; // 40 seconds
const REQUIRED_ACCURACY = 50;   // Must be better (smaller) than 50 meters

/**
 * A hook to get an accurate GPS location, failing if the required accuracy isn't met.
 * It waits for the first location reading that is better than REQUIRED_ACCURACY.
 * If the timeout is reached, it fails.
 *
 * @returns An object with:
 *  - `getLocation`: An async function that resolves with an accurate position or rejects with an error.
 *  - `isGettingLocation`: A boolean indicating if the location is currently being fetched.
 */
export function useAccurateLocation() {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getLocation = useCallback((): Promise<GeolocationPosition> => {
    setIsGettingLocation(true);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setIsGettingLocation(false);
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }

      // Use a single 'const' object to hold the IDs. This resolves the lint error
      // as the object reference is constant, even though its properties are assigned later.
      const watcherIds: { watchId?: number; timeoutId?: NodeJS.Timeout } = {};

      const clearWatchers = () => {
        if (watcherIds.watchId) navigator.geolocation.clearWatch(watcherIds.watchId);
        if (watcherIds.timeoutId) clearTimeout(watcherIds.timeoutId);
        setIsGettingLocation(false);
      };

      // Set a timeout that will fail the process if it takes too long.
      watcherIds.timeoutId = setTimeout(() => {
        clearWatchers();
        reject(new Error(`Could not get a location with required accuracy (${REQUIRED_ACCURACY}m) within 40 seconds. Please try again in an open area with a clear sky.`));
      }, LOCATION_TIMEOUT);

      // Start watching for position updates.
      watcherIds.watchId = navigator.geolocation.watchPosition(
        // Success callback for EACH position update
        (position) => {
          console.log(`Received position update with accuracy: ${position.coords.accuracy}m`);
          // If the new position meets our accuracy requirement, we are done.
          if (position.coords.accuracy <= REQUIRED_ACCURACY) {
            console.log(`Sufficient accuracy achieved: ${position.coords.accuracy}m. Resolving.`);
            clearWatchers();
            resolve(position);
          }
          // Otherwise, we do nothing and just wait for the next update.
        },
        // Error callback
        (err) => {
          clearWatchers();
          reject(new Error(`Geolocation Error: ${err.message}. Please ensure location services are enabled for this site in your browser/system settings.`));
        },
        // Options: MUST request high accuracy and a fresh reading.
        {
          enableHighAccuracy: true,
          timeout: LOCATION_TIMEOUT,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { getLocation, isGettingLocation };
}