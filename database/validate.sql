SELECT 'zones' AS table_name, COUNT(*) AS row_count FROM zones
UNION ALL
SELECT 'trips' AS table_name, COUNT(*) AS row_count FROM trips;

SELECT
    COUNT(DISTINCT (source_file, source_row_number)) AS distinct_source_pairs, 
    COUNT(*) AS total_rows,
    CASE 
        WHEN COUNT(DISTINCT (source_file, source_row_number)) = COUNT(*) THEN 'PASS' 
        ELSE  'FAIL'
    END AS status
FROM trips;

SELECT
    COUNT(t.pickup_location_id) FILTER (WHERE pz.location_id IS NULL) AS unmapped_pickup_zones,
    COUNT(t.dropoff_location_id) FILTER (WHERE dz.location_id IS NULL) AS unmapped_dropoff_zones
FROM trips t 
LEFT JOIN zones pz ON t.pickup_location_id = pz.location_id
LEFT JOIN zones dz ON t.dropoff_location_id = dz.location_id;

SELECT 
    COUNT(*) FILTER (WHERE flag_negative_duration = TRUE) AS neg_duration_true,
    COUNT(*) FILTER (WHERE flag_negative_duration = FALSE) AS neg_duration_false,
    COUNT(*) FILTER (WHERE flag_negative_duration IS NULL) AS neg_duration_null,
    COUNT(*) FILTER (WHERE eligible_speed_analysis = TRUE) AS speed_analysis_true,
    COUNT(*) FILTER (WHERE eligible_speed_analysis = FALSE) AS speed_analysis_false,
    COUNT(*) FILTER (WHERE eligible_speed_analysis IS NULL) AS speed_analysis_null
FROM trips;

SELECT
    MIN(pickup_datetime) AS earliest_pickup,
    MAX(pickup_datetime) AS latest_pickup,
    MIN(dropoff_datetime) AS earliest_dropoff,
    MAX(dropoff_datetime) AS latest_dropoff
FROM trips;

SELECT
    COUNT(*) FILTER (WHERE congestion_surcharge IS NULL) AS null_congestion_surcharges,
    COUNT(*) FILTER (WHERE fare_amount IS NULL) AS null_fare_amounts,
    COUNT(*) FILTER (WHERE average_speed_mph IS NULL) AS null_average_speed
FROM trips;