package com.cityai.backend.spatial;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Enables PostGIS and adds spatial (geography) columns + GiST indexes on
 * top of the JPA-managed lat/lon columns - only under the "postgres"
 * profile, only runs against a real PostgreSQL database.
 *
 * Runs after Hibernate's ddl-auto has created the base tables (standard
 * ApplicationRunner ordering, after context refresh), and is idempotent
 * (IF NOT EXISTS everywhere) so it's safe on every startup. Execution
 * order relative to DataSeedService's camera seeding doesn't matter - the
 * generated column recomputes from lat/lon for every row regardless of
 * when it was inserted.
 *
 * Why generated columns instead of mapping geometry types in JPA: the
 * app's business logic (distance/bearing in TrajectoryEngine, DTOs, the
 * frontend) all works in plain lat/lon and doesn't need to change: this
 * adds real spatial indexing/query capability (see SpatialCameraService)
 * as an addition, not a rewrite of the ORM layer.
 */
@Component
@Profile("postgres")
public class PostGisMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PostGisMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public PostGisMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS postgis");
        addSpatialColumn("cameras");
        addSpatialColumn("vehicle_detections");
        log.info("PostGIS extension + spatial columns/indexes ensured (cameras, vehicle_detections).");
    }

    private void addSpatialColumn(String table) {
        jdbcTemplate.execute("""
                ALTER TABLE %s ADD COLUMN IF NOT EXISTS location geography(Point,4326)
                    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED
                """.formatted(table));
        jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_%s_location ON %s USING GIST(location)".formatted(table, table));
    }
}
