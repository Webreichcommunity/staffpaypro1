export const getBrowserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy || 0),
        }),
      () => reject(new Error("Location permission denied. Please turn ON location to mark attendance.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });

export const calculateDistanceMeters = (from, to) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return Number.POSITIVE_INFINITY;
  const radius = 6371000;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const isWithinRadius = (currentLocation, shopLocation, radiusMeters) =>
  calculateDistanceMeters(currentLocation, shopLocation) <= Number(radiusMeters || 0);
