CREATE INDEX idx_trips_pickup_hour
    ON trips ((EXTRACT(HOUR FROM pickup_datetime)));

CREATE INDEX idx_trips_pickup_zone
    ON trips (pickup_location_id);

ANALYZE trips;
