import pandas as pd
# load parquet file

parquet_file = "data/intermediate/yellow_tripdata_2019-01_raw.parquet"

trips = pd.read_parquet(parquet_file)

#count missing values in each column 
missing_counts = trips.isna().sum()
print(missing_counts)

print("Table Size:", trips.shape)

#count duplicate rows

duplicate_count = trips.duplicated().sum()
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


time_columns = [
    "tpep_pickup_datetime", 
    "tpep_dropoff_datetime", 
    "trip_distance", 
    "fare_amount", 
    "trip_duration_minutes",
]



# check if any zero duration trips have +ve distance covered

zero_time_positive_dstance = zero_duration & (trips["trip_distance"] > 0)




#now to identify negative trip distances 

negative_distance = (trips["trip_distance"] < 0)



#zero distance and also positive duration. . . wtf

zero_distance = (trips["trip_distance"] == 0)
positive_duration = (trips["tpep_dropoff_datetime"] > trips["tpep_pickup_datetime"])
zero_distance_positive_duration = zero_distance & positive_duration


#flags
trips["flags_negative_duration"] = negative_duration
trips["flags_zero_duration"] = zero_duration
trips["flags_zero_time_positive_distance"] = zero_time_positive_dstance
trips["flags_zero_distance_positive_duration"] = zero_distance_positive_duration


# trip duration
time_passed = trips["tpep_dropoff_datetime"] - trips["tpep_pickup_datetime"]

trips["trip_duration_minutes"] = time_passed.dt.total_seconds()/60


#inspecting if the invalid trips have charges associated with them or any distance traveled

print(trips.loc[negative_duration, time_columns])
print(trips.loc[zero_duration, time_columns].head(5))

print("Zero Time Positive Distance: ", zero_time_positive_dstance.sum())
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
trips["flag_long_duration_review"] = long_duration


print(trips.loc[near_day, time_columns].head(5))

print(trips["trip_distance"].describe())
print(trips.nlargest(5, "trip_distance")[time_columns])