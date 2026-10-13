SELECT 
    z.location_id AS location_id,
    z.zone_name,
    z.borough,
    COUNT(t.source_row_number) AS pickup_count,
    COUNT(t.source_row_number) FILTER (WHERE t.eligible_speed_analysis = TRUE) AS eligible_speed_count,
    AVG(t.average_speed_mph) FILTER (WHERE t.eligible_speed_analysis = TRUE) AS mean_trip_speed_mph, 
    COUNT(t.fare_amount) FILTER (WHERE t.fare_amount >= 0) AS eligible_fare_count,
    AVG(t.fare_amount) FILTER (WHERE t.fare_amount >= 0) AS mean_base_fare, 
    COUNT(t.trip_distance) FILTER (WHERE t.trip_distance >= 0) AS eligible_distance_count,
    AVG (t.trip_distance) FILTER (WHERE t.trip_distance >= 0) AS mean_trip_distance
FROM zones z
LEFT JOIN trips t 
    ON z.location_id = t.pickup_location_id
    AND EXTRACT(HOUR FROM t.pickup_datetime) = $1
    AND t.pickup_datetime >= '2019-01-01 00:00:00'
    AND t.pickup_datetime < '2019-02-01 00:00:00'
GROUP BY    
    z.location_id,
    z.zone_name,
    z.borough
ORDER BY 
    z.location_id;

