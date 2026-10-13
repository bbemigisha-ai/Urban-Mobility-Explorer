#export parquet data to csv for Karyna
import csv
import pandas as pd
source_path = "data/processed/yellow_tripdata_2019-01_enriched.parquet"

column_names = {
    "VendorID": "vendor_id",
    "RatecodeID": "rate_code_id",
    "PULocationID": "pickup_location_id", 
    "DOLocationID": "dropoff_location_id", 
    "tpep_pickup_datetime": "pickup_datetime", 
    "tpep_dropoff_datetime": "dropoff_datetime",
}
export_trips = pd.read_parquet(source_path)

export_trips["source_file"] = "yellow_tripdata_2019-01.csv"

export_trips.columns = [
    name.replace("flags_", "flag_", 1)
    if name.startswith("flags_")
    else name
    for name in export_trips.columns
]


print(export_trips[["source_file", "source_row_number"]].head())

export_trips = export_trips.rename(columns=column_names)
print(export_trips.columns.to_list())


#export sample trips

sample_trips = export_trips.head(10000)

sample_trips.to_csv("data/processed/trips_sample.csv", index=False, na_rep="\\N")
print("Exported")

#Export Zones to CSV

zone_column_name = {
    "LocationID": "location_id", 
    "Borough": "borough", 
    "Zone": "zone_name",
    "service_zone": "service_zone",
}

taxi_zones = "data/raw/taxi_zone_lookup.csv"
export_taxi_zones = pd.read_csv(taxi_zones)



export_taxi_zones = export_taxi_zones.rename(columns=zone_column_name)
print(export_taxi_zones.columns.to_list())


#make sure that each pickup and dropoff location ID exists in the exported zones table
missing_pickup = ~sample_trips["pickup_location_id"].isin(export_taxi_zones["location_id"])
missing_dropoff = ~sample_trips["dropoff_location_id"].isin(export_taxi_zones["location_id"])

print("Unmatched pickup IDs: ", missing_pickup.sum())
print("Unmatched dropoff IDs: ", missing_dropoff.sum())



export_taxi_zones.to_csv("data/processed/zones.csv", index=False, na_rep="\\N")

# export full trips to CSV
export_trips.to_csv("data/processed/trips_full.csv", index=False, na_rep="\\N")

#sanity check
exported_row_count = 0

with open("data/processed/trips_full.csv", newline="") as file:
    reader = csv.reader(file)
    next(reader)
    for row in reader: 
        exported_row_count +=1

print("Exported Rows: ", exported_row_count)
print("Expected Rows: ", len(export_trips))