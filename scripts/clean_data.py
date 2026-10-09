
import pandas as pd
import shapefile
#Quality Checks on the data to find discrepancies before we start cleaning
# load parquet file

parquet_file = "data/intermediate/yellow_tripdata_2019-01_raw.parquet"

trips = pd.read_parquet(parquet_file)



time_columns = [
    "tpep_pickup_datetime", 
    "tpep_dropoff_datetime", 
    "trip_distance", 
    "fare_amount", 
    "trip_duration_minutes",
    "average_speed_mph",
]

#fares and total charges
for column in ["fare_amount", "total_amount"]:
    print("\nSummary: ", column)
    print(trips[column].describe())
    print("Negative values: ", (trips[column] < 0).sum())
    print("Zero Values: ", (trips[column] == 0).sum())

#passenger counts and category codes

for column in [
    "passenger_count",
    "VendorID",
    "RatecodeID",
    "payment_type",
    "store_and_fwd_flag",
]:

    print("\nValue Counts: ", column)
    print(trips[column].value_counts(dropna=False))

#Date coverage
for column in ["tpep_pickup_datetime", "tpep_dropoff_datetime"]:
    print("\nDate range: ", column)
    print("Earliest : ", trips[column].min())
    print("Latest : ", trips[column].max())

#Use Jan as a test

outside_january = (
    (trips["tpep_pickup_datetime"] < pd.Timestamp("2019-01-01")) | 
    (trips["tpep_pickup_datetime"] >= pd.Timestamp("2019-02-01"))
)

print("Pickups outside January 2019", outside_january.sum())

##Location

zones = pd.read_csv("data/raw/taxi_zone_lookup.csv")
print("Duplicate lookup IDs: ", zones["LocationID"].duplicated().sum())

for column in ["PULocationID", "DOLocationID"]: 
    unmatched = ~trips[column].isin(zones["LocationID"]) #~reverses results to see unmatched IDs
    print("\nUnmatched IDs:", column)
    print(trips.loc[unmatched, column].value_counts(dropna=False))

#check for -ve charges

negative_fare = trips["fare_amount"] < 0
negative_total = trips["total_amount"] < 0
negative_charge = negative_fare | negative_total


print(
    "Rows where only one amount is negative: ",
    (negative_fare ^ negative_total).sum()
)

print(
    trips.loc[negative_charge, "payment_type"]
    .value_counts(dropna=False)
)



#count missing values in each column 
missing_counts = trips.isna().sum()
print(missing_counts)

print("Table Size:", trips.shape)

#count duplicate rows

duplicate_count = trips.duplicated().sum()
trips["source_row_number"] = range(len(trips))

print("Duplicate Count:", duplicate_count)

#check if any trip would end at or before its pickup time - to rule out invalid trips

invalid_trip = (trips["tpep_dropoff_datetime"] <= trips["tpep_pickup_datetime"])

print("Trips ending at or before pickup time:", invalid_trip.sum())

# nothing here changes removes data yet - just checking what anomalies we're working with first

#probably should separate the "invalid" trips to two categories: 
#negative duration = drop off happens earlier than the pickup

negative_duration = (trips["tpep_dropoff_datetime"] < trips["tpep_pickup_datetime"])

#zero duration = drop off and pickup timestamps are the same

zero_duration = (trips["tpep_dropoff_datetime"] == trips["tpep_pickup_datetime"])


print("Negative Duration: ", negative_duration.sum())
print("Zero Duration: ", zero_duration.sum())





# check if any zero duration trips have +ve distance covered

zero_time_positive_distance = zero_duration & (trips["trip_distance"] > 0)


#now to identify negative trip distances 

negative_distance = (trips["trip_distance"] < 0)

#zero distance and also positive duration. . . wtf

zero_distance = (trips["trip_distance"] == 0)
positive_duration = (trips["tpep_dropoff_datetime"] > trips["tpep_pickup_datetime"])
zero_distance_positive_duration = zero_distance & positive_duration


#flags
trips["flags_negative_duration"] = negative_duration
trips["flags_zero_duration"] = zero_duration
trips["flags_zero_time_positive_distance"] = zero_time_positive_distance
trips["flags_zero_distance_positive_duration"] = zero_distance_positive_duration


# trip duration
time_passed = trips["tpep_dropoff_datetime"] - trips["tpep_pickup_datetime"]

trips["trip_duration_minutes"] = time_passed.dt.total_seconds()/60


#calculate average trip speed

#speed = distance in miles ÷ time in hours
#time is in mins so ÷ 60 initially

speed_candidate = ((trips["trip_duration_minutes"] > 0) & (trips["trip_distance"] > 0))

trips["average_speed_mph"] = pd.Series(pd.NA, index=trips.index, dtype="Float64")

trips.loc[speed_candidate, "average_speed_mph"] = (trips.loc[speed_candidate, "trip_distance"] / (trips.loc[speed_candidate, "trip_duration_minutes"]/60))

print(trips.nlargest(5, "average_speed_mph")[time_columns])


#inspecting if the invalid trips have charges associated with them or any distance traveled

print(trips.loc[negative_duration, time_columns])
print(trips.loc[zero_duration, time_columns].head(5))

print("Zero Time Positive Distance: ", zero_time_positive_distance.sum())
print("Negative Distance: ", negative_distance.sum())

print("Zero Distance & Positive Duration: ", zero_distance_positive_duration.sum())
print(trips.loc[zero_distance_positive_duration, time_columns].head(5))

print(trips["trip_duration_minutes"].describe())
print(trips.nlargest(5, "trip_duration_minutes")[time_columns])


#trying to gauge long duration cutoffs

for minutes in [60, 120, 180]:
    count = (trips["trip_duration_minutes"] > minutes).sum()

    print("Trips longer than", minutes, "minutes: ", count)


long_duration = trips["trip_duration_minutes"] > 180

print(trips.loc[long_duration, "trip_duration_minutes"].describe())

near_day = (
    (trips["trip_duration_minutes"] >= 1390) & (trips["trip_duration_minutes"] <= 1440)

)
trips["flags_long_duration_review"] = long_duration


print(trips.loc[near_day, time_columns].head(5))

print(trips["trip_distance"].describe())
print(trips.nlargest(5, "trip_distance")[time_columns])


#investigate speed thresholds

for mph in [60, 80, 100]:
    count = (trips["average_speed_mph"] > mph).sum()
    print("Recorded Average Speed Above", mph, "mph: ", count)


speed_review_band = ((trips["average_speed_mph"] > 80) & (trips["average_speed_mph"] <= 100))

print(trips.loc[speed_review_band, time_columns].head(10))

trips["flags_high_speed_review"] = (trips["average_speed_mph"] > 80 ).fillna(False)

#check the largest fares
fare_columns = [
    "tpep_dropoff_datetime",
    "tpep_pickup_datetime",
    "trip_distance",
    "trip_duration_minutes", 
    "RatecodeID",
    "payment_type",
    "fare_amount",
    "total_amount",
]

print(trips.nlargest(5, "fare_amount")[fare_columns])

trips["flags_negative_charge_review"] = negative_charge



reader = shapefile.Reader("data/raw/taxi_zones/taxi_zones.shp")

spatial_ids = {
    record["LocationID"]
    for record in reader.iterRecords()
}

for column in ["PULocationID", "DOLocationID"]: 
    without_shape = ~trips[column].isin(spatial_ids)

    print("\nTrips without shape: ", column, without_shape.sum())
    print(trips.loc[without_shape, column].value_counts())


trips["pickup_has_shape"] = trips["PULocationID"].isin(spatial_ids)
trips["dropoff_has_shape"] = trips["DOLocationID"].isin(spatial_ids)

#findout which trip is missing either shape
missing_either_shape = (
    ~trips["pickup_has_shape"] | ~trips["dropoff_has_shape"]
)

print("Trips missing either endpoint shape: ", missing_either_shape.sum())






qc_summary = {
    "total_rows": len(trips), 
    "negative_duration": int(negative_duration.sum()),
    "zero_duration": int(zero_duration.sum()),
    "zero_distance_positive_duration": int (zero_distance_positive_duration.sum()),
    "missing_either_shape": int (missing_either_shape.sum()),
    "negative_distance": int(negative_distance.sum()),
    "long_duration_review": int(long_duration.sum()),
    "high_speed_review": int(trips["flags_high_speed_review"].sum()), 
    "negative_charge_review": int(negative_charge.sum()),
    "pickup_outside_january": int(outside_january.sum()),
    "zero_time_positive_distance": int(zero_time_positive_distance.sum()),
}

print(pd.Series(qc_summary))



#

trips["eligible_speed_analysis"] = (
    (~outside_january) & 
    (trips["trip_duration_minutes"] > 0) & 
    (trips["trip_distance"] > 0) & 
    (~long_duration) & 
    (~trips["flags_high_speed_review"])
).fillna(False)

trips["eligible_speed_map"] = (
    trips["eligible_speed_analysis"] & 
    trips["pickup_has_shape"] & 
    trips["dropoff_has_shape"]
)

print("Eligible for speed analysis: ", trips["eligible_speed_analysis"].sum())
print("Eligible for both-endpoint speed map: ", trips["eligible_speed_map"].sum())


trips["flags_pickup_outside_january"] = outside_january
trips["flags_missing_endpoint_shape"] = missing_either_shape
trips["flags_negative_distance"] = negative_distance

review_columns = [
    "flags_negative_duration",
    "flags_zero_duration",
    "flags_zero_time_positive_distance",
    "flags_zero_distance_positive_duration",
    "flags_long_duration_review",
    "flags_high_speed_review",
    "flags_negative_charge_review",
    "flags_pickup_outside_january",
    "flags_missing_endpoint_shape",
    "flags_negative_distance",

]

needs_review = trips[review_columns].any(axis=1)

trips.loc[needs_review].to_parquet(
    "data/audit/trips_for_review.parquet",
    engine="pyarrow",
    index=False,
)

print("Unique records requiring review: ", needs_review.sum())

qc_summary["missing_congestion_surcharge"] = int(trips["congestion_surcharge"].isna().sum())
qc_summary["eligible_speed_analysis"] = int(trips["eligible_speed_analysis"].sum())
qc_summary["eligible_speed_map"] = int(trips["eligible_speed_map"].sum())
qc_summary["unique_records_requiring_review"] = int(needs_review.sum())

trips.to_parquet(
    "data/processed/yellow_tripdata_2019-01_enriched.parquet",
    engine="pyarrow",
    index=False
)

pd.Series(qc_summary, name="record_count").to_csv("data/audit/qc_summary.csv", index_label="check")


