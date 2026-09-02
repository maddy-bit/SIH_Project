package com.cityai.backend.trajectory;

/** Great-circle distance and bearing helpers used by the trajectory engine. */
public final class GeoUtils {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtils() {
    }

    /** Great-circle distance between two points, in kilometers. */
    public static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /** Initial compass bearing from point 1 to point 2, in degrees [0, 360). */
    public static double bearingDegrees(double lat1, double lon1, double lat2, double lon2) {
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double deltaLambda = Math.toRadians(lon2 - lon1);

        double y = Math.sin(deltaLambda) * Math.cos(phi2);
        double x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
        double theta = Math.atan2(y, x);
        return (Math.toDegrees(theta) + 360) % 360;
    }

    /** Compass direction ("N", "NE", ...) to degrees, or null if unrecognized. */
    public static Double compassToDegrees(String compass) {
        if (compass == null) {
            return null;
        }
        return switch (compass.trim().toUpperCase()) {
            case "N" -> 0.0;
            case "NE" -> 45.0;
            case "E" -> 90.0;
            case "SE" -> 135.0;
            case "S" -> 180.0;
            case "SW" -> 225.0;
            case "W" -> 270.0;
            case "NW" -> 315.0;
            default -> null;
        };
    }

    /** Smallest absolute angular difference between two bearings, in [0, 180]. */
    public static double angularDifference(double a, double b) {
        double diff = Math.abs(a - b) % 360;
        return diff > 180 ? 360 - diff : diff;
    }
}
