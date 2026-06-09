const DESIRED_ACCURACY_METERS = 30;
const MAX_ACCURACY_ALLOWANCE_METERS = 100;

export const normalizeLocation = (location) => ({
  lat: Number(location?.lat ?? location?.latitude),
  lng: Number(location?.lng ?? location?.longitude),
  accuracy: Math.max(0, Number(location?.accuracy || 0)),
});

export const isValidLocation = (location) => {
  const { lat, lng } = normalizeLocation(location);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90
    && lat <= 90
    && lng >= -180
    && lng <= 180
    && !(lat === 0 && lng === 0);
};

const toLocation = (position) => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  accuracy: Math.round(position.coords.accuracy || 0),
});

const locationErrorMessage = (error) => {
  if (error?.code === 1) return "Location permission denied. Please allow precise location access and try again.";
  if (error?.code === 2) return "Your location is unavailable. Turn ON GPS and move near a window, then try again.";
  if (error?.code === 3) return "Location request timed out. Keep GPS ON and try again.";
  return "Unable to get your location. Please turn ON GPS and try again.";
};

export const getBrowserLocation = ({ timeout = 12000, desiredAccuracy = DESIRED_ACCURACY_METERS } = {}) =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this device."));
      return;
    }

    let bestLocation = null;
    let lastError = null;
    let settled = false;
    let watchId;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      if (bestLocation) resolve(bestLocation);
      else reject(new Error(locationErrorMessage(lastError)));
    };

    const timer = window.setTimeout(finish, timeout);
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation = toLocation(position);
        if (!bestLocation || nextLocation.accuracy < bestLocation.accuracy) bestLocation = nextLocation;
        if (nextLocation.accuracy <= desiredAccuracy) {
          window.clearTimeout(timer);
          finish();
        }
      },
      (error) => {
        lastError = error;
        if (error.code === 1) {
          window.clearTimeout(timer);
          finish();
        }
      },
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    );
  });

export const calculateDistanceMeters = (from, to) => {
  if (!isValidLocation(from) || !isValidLocation(to)) return Number.POSITIVE_INFINITY;
  const normalizedFrom = normalizeLocation(from);
  const normalizedTo = normalizeLocation(to);
  const radius = 6371000;
  const lat1 = (normalizedFrom.lat * Math.PI) / 180;
  const lat2 = (normalizedTo.lat * Math.PI) / 180;
  const deltaLat = ((normalizedTo.lat - normalizedFrom.lat) * Math.PI) / 180;
  const deltaLng = ((normalizedTo.lng - normalizedFrom.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const evaluateLocationAccess = (currentLocation, shopLocation, radiusMeters) => {
  const radius = Math.max(0, Number(radiusMeters || 0));
  const distance = calculateDistanceMeters(currentLocation, shopLocation);
  const accuracy = normalizeLocation(currentLocation).accuracy;
  const shopLocationAccuracy = normalizeLocation(shopLocation).accuracy;
  const accuracyAllowance = Math.min(accuracy + shopLocationAccuracy, MAX_ACCURACY_ALLOWANCE_METERS);

  return {
    accuracy,
    accuracyAllowance,
    allowed: Number.isFinite(distance) && radius > 0 && distance <= radius + accuracyAllowance,
    distance,
    radius,
    shopLocationAccuracy,
  };
};

export const isWithinRadius = (currentLocation, shopLocation, radiusMeters) =>
  evaluateLocationAccess(currentLocation, shopLocation, radiusMeters).allowed;
