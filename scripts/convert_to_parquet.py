
import pandas as pd

source_path = "data/raw/yellow_tripdata_2019-01.csv"
output_path = "data/intermediate/yellow_tripdata_2019-01_raw.parquet"

column_types = {
    "VendorID": "Int64",
    "RatecodeID": "Int64",
    "PULocationID": "Int64",
    "DOLocationID": "Int64", 
    "payment_type": "Int64", 
    "passenger_count": "Int64",
    "trip_distance": "Float64",
    "fare_amount": "Float64",
    "extra": "Float64",
    "mta_tax": "Float64",
    "tip_amount": "Float64",
    "tolls_amount": "Float64",
    "improvement_surcharge": "Float64",
    "total_amount": "Float64",
    "congestion_surcharge": "Float64",
    "store_and_fwd_flag": "string", 
    "tpep_pickup_datetime": "string", 
    "tpep_dropoff_datetime": "string"

}

trips = pd.read_csv(source_path, dtype=column_types)

trips["tpep_pickup_datetime"] = pd.to_datetime(trips["tpep_pickup_datetime"],format="%Y-%m-%d %H:%M:%S",errors="raise")
trips["tpep_dropoff_datetime"] = pd.to_datetime(trips["tpep_dropoff_datetime"],format="%Y-%m-%d %H:%M:%S",errors="raise")

print(trips["tpep_pickup_datetime"])
print(trips["tpep_dropoff_datetime"])
print(trips.shape)
print(trips.dtypes)


trips.to_parquet(output_path, engine="pyarrow", index=False)
reloaded = pd.read_parquet(output_path)
print("Round-trip matches", reloaded.equals(trips))