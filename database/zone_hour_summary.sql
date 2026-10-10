--change this number when you want to change your target hour.
\set target_hour 1
SELECT 
    z.location_id AS zone_id,
    z.zone_name,
    z.borough,
    COUNT(t.source_row_number) AS pickup_count,
    COUNT(t.source_row_number) FILTER (WHERE t.eligible_speed_analysis = TRUE) AS eligible_count,
    AVG(t.average_speed_mph) FILTER (WHERE t.eligible_speed_analysis = TRUE) AS mean_speed
FROM zones z
LEFT JOIN trips t 
    ON z.location_id = t.pickup_location_id
    AND EXTRACT(HOUR FROM t.pickup_datetime) = :target_hour
    AND t.pickup_datetime >= '2019-01-01 00:00:00'
    AND t.pickup_datetime < '2019-02-01 00:00:00'
GROUP BY    
    z.location_id,
    z.zone_name,
    z.borough
ORDER BY 
    z.location_id;

