# Data Dictionary

The trips dataset contains January 2019 NYC yellow taxi records.
Records are retained with quality flags; eligibility fields determine
which records are suitable for speed analysis.

## Identifiers

| Column              | Meaning                                     | SQL type |
| ------------------- | ------------------------------------------- | -------- |
| source_file         | Original source filename                    | TEXT     |
| source_row_number   | Zero-based record position in the source    | BIGINT   |
| vendor_id           | Data provider code, not an individual taxi  | INTEGER  |
| pickup_location_id  | Pickup zone; references zones.location_id   | INTEGER  |
| dropoff_location_id | Drop-off zone; references zones.location_id | INTEGER  |
| rate_code_id        | Recorded fare rate category                 | INTEGER  |
| payment_type        | Recorded payment category                   | INTEGER  |

source_file and source_row_number are used together to identify a record. Although each row number can repeat across files, the filename/row-number pair must be unique.
What is important to note though, is that this just identifies the source record. This doesn't identify a taxi or even prove that this exact trip couldn't appear elsewhere.

## Timestamps and Measurements

| Column           | Meaning                       | Unit / storage              |
| ---------------- | ----------------------------- | --------------------------- | -------------------------------------------------------- |
| pickup_datetime  | Recorded trip start           | TIMESTAMP WITHOUT TIME ZONE | [Timezone information has not been attached to timestamp |
| dropoff_datetime | Recorded trip end             | TIMESTAMP WITHOUT TIME ZONE | (Don't silently convert to UTC)]                         |
| passenger_count  | Recorded number of passengers | INTEGER                     |
| trip_distance    | Recorded trip distance        | Miles; NUMERIC              |

| Column                  | Calculation                                 | Unit           |
| ----------------------- | ------------------------------------------- | -------------- |
| `trip_duration_minutes` | Drop-off minus pickup, expressed in minutes | Minutes        |
| `average_speed_mph`     | Distance ÷ (duration ÷ 60)                  | Miles per hour |

NB
Speed details would be missing if distance or duration is not positive
Flags have been put in place for control during analysis

## Money

All Amounts are in USD

| Column                | Meaning                               |
| --------------------- | ------------------------------------- |
| fare_amount           | Recorded base fare                    |
| extra                 | Recorded extras or additional charges |
| mta_tax               | Recorded MTA tax                      |
| tip_amount            | Recorded tip amount                   |
| tolls_amount          | Recorded toll charges                 |
| improvement_surcharge | Recorded improvement surcharge        |
| total_amount          | Recorded total amount                 |
| congestion_surcharge  | Recorded congestion surcharge         |

NB

Missing amounts remain NULL; they are not replaced with zero.
Negative fares or totals are retained and flagged for review.
The congestion surcharge is not a reflection or measurement of traffic congestion - Just a monetary charge.

## QC Flags

They're all BOOLEAN, and True means the conditions were triggered

| Column                               | Condition                                               |
| ------------------------------------ | ------------------------------------------------------- |
| flag_negative_duration               | Drop-off occurs before pickup                           |
| flag_zero_duration                   | Pickup and drop-off times are equal                     |
| flag_zero_time_positive_distance     | Zero duration but positive distance                     |
| flag_zero_distance_positive_duration | Zero distance but positive duration                     |
| flag_long_duration_review            | Duration exceeds 180 minutes                            |
| flag_high_speed_review               | Calculated average speed exceeds 80 mph                 |
| flag_negative_charge_review          | Fare or total amount is negative                        |
| flag_pickup_outside_january          | Pickup is before January 2019 or on/after February 2019 |
| flag_missing_endpoint_shape          | Either endpoint lacks matching map geometry             |
| flag_negative_distance               | Distance is negative                                    |

Flags preserve suspicious records for review rather than deleting them.
The 180-minute and 80-mph thresholds are provisional analysis rules.

## Geometry availability and eligibility

| Column                  | Meaning                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| pickup_has_shape        | Pickup location ID has matching spatial metadata                                                       |
| dropoff_has_shape       | Drop-off location ID has matching spatial metadata                                                     |
| eligible_speed_analysis | January pickup, positive distance and duration, duration at most 180 minutes, and speed at most 80 mph |
| eligible_speed_map      | Eligible for speed analysis, with geometry available for both endpoints                                |

## ETC

| Column             | Meaning                                                                       | Storage |
| ------------------ | ----------------------------------------------------------------------------- | ------- |
| store_and_fwd_flag | Y means the trip record was stored before being forwarded; N means it was not | TEXT    |
