package com.cityai.backend.spatial;

import com.cityai.backend.dto.CameraDto;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Real PostGIS-backed spatial queries - only registered under the
 * "postgres" profile (see PostGisMigrationRunner for the schema this
 * relies on). CameraController falls back to a clear 501 when this bean
 * isn't present, i.e. when running on the default H2 profile.
 */
@Service
@Profile("postgres")
public class SpatialCameraService {

    private final JdbcTemplate jdbcTemplate;

    public SpatialCameraService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Cameras within radiusKm of (lat, lon), nearest first - a real ST_DWithin + KNN query. */
    public List<CameraDto> findNearby(double latitude, double longitude, double radiusKm) {
        String sql = """
                SELECT id, name, latitude, longitude, direction, status
                FROM cameras
                WHERE ST_DWithin(location, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography, ?)
                ORDER BY location <-> ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
                """;
        double radiusMeters = radiusKm * 1000;
        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new CameraDto(
                        rs.getString("id"),
                        rs.getString("name"),
                        rs.getDouble("latitude"),
                        rs.getDouble("longitude"),
                        rs.getString("direction"),
                        rs.getString("status")
                ),
                longitude, latitude, radiusMeters, longitude, latitude
        );
    }
}
