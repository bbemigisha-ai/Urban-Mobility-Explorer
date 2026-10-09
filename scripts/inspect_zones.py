import pandas as pd
import shapefile

reader = shapefile.Reader("./data/raw/taxi_zones/taxi_zones.shp")

print("Number of shapes: ", len(reader))
print("Attribute fields: ", reader.fields)
print("First record: ", reader.record(0))


spatial_ids =[
    record["LocationID"]
    for record in reader.iterRecords()
]

spatial_id_counts = pd.Series(spatial_ids).value_counts()
print("Repeated spatial IDs: ")
print(spatial_id_counts[spatial_id_counts > 1])

zones = pd.read_csv("data/raw/taxi_zone_lookup.csv")

without_shape = ~zones["LocationID"].isin(spatial_ids)

print("Lookup entries without shape: ")
print(zones.loc[without_shape])

