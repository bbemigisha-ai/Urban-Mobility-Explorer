import geopandas as gpd
import pandas as pd

zones = gpd.read_file("data/raw/taxi_zones/taxi_zones.shp") #load geometry and its attributes

print("Shape records", len(zones))
print("Coordinate system: ", zones.crs)
print("Columns", zones.columns.to_list())
print(zones[["LocationID", "zone", "borough"]].head())


zones = zones.to_crs(epsg=4326) # recalculate boundaries as longitude and latitude but keep same locations

print("Converted coordinate system: ", zones.crs)
print("Boundary extent: ", zones.total_bounds)

#to give each zone one map while still preserving separate pieces
zones = zones[["LocationID", "geometry"]].dissolve(
    by="LocationID", 
    as_index=False
)

print ("Unique zone features: ", len(zones))
print("Repeated IDs: ", zones["LocationID"].duplicated().sum())


#match labels from zones.csv so that the map and database can use the same names

zones_lookup = pd.read_csv(
    "data/processed/zones.csv", 
    na_values=["\\N"] #restore missing value markers
)

zones = zones.rename(columns={"LocationID": "location_id"})

zones = zones.merge(
    zones_lookup, 
    on="location_id", #match geometry to lookup entry
    how="left", #keep every existing entry
    validate="one_to_one" #catch duplicate IDs
)

print("Features after joining", len(zones))
print(zones[["location_id", "zone_name", "borough"]].head())

# check geometry before exporting

# print("Missing geometry: ", zones.geometry.isna().sum())
# print("Empty geometry: ", zones.geometry.is_empty.sum())
# print("Invalid geometry: ", (~zones.geometry.is_valid).sum())


zones.to_file("data/processed/taxi_zones.geojson", driver="GeoJSON", index=False)

#check if export is kosher
saved_zones = gpd.read_file("data/processed/taxi_zones.geojson")

print("Saved Features: ", len(saved_zones))
print("Saved CRS: ", saved_zones.crs)
print("Duplicate IDs: ", saved_zones["location_id"].duplicated().sum())