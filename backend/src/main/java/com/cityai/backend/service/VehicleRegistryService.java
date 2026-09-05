package com.cityai.backend.service;

import java.util.Optional;

/**
 * Looks up vehicle metadata (type/make/model/color) for a plate.
 *
 * The prototype implementation (MockVehicleRegistryService) reads a local
 * JSON file. A real deployment would replace this with a call to an
 * authorized government/RTO registry - callers never need to change, only
 * the implementation swapped.
 */
public interface VehicleRegistryService {
    Optional<VehicleRegistryRecord> lookup(String normalizedPlate);
}
