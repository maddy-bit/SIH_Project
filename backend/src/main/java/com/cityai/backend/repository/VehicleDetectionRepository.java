package com.cityai.backend.repository;

import com.cityai.backend.model.VehicleDetection;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleDetectionRepository extends JpaRepository<VehicleDetection, Long> {

    List<VehicleDetection> findByVehicle_PlateOrderByTimestampAsc(String plate);

    List<VehicleDetection> findByVehicle_PlateAndTimestampBetweenOrderByTimestampAsc(
            String plate, Instant start, Instant end);

    List<VehicleDetection> findByCamera_IdOrderByTimestampDesc(String cameraId);
}
