# Urban Mobility Explorer 🚕🗽

Where do NYC taxi trips begin, how quickly do they move, and how does that change throughout the day?

Urban Mobility Explorer is a student-built dashboard that turns **January 2019 NYC yellow taxi records** into an interactive map of urban movement.

## What we're building

Our Leaflet dashboard will let users select a pickup hour and explore:

- **Taxi activity:** pickup counts across NYC taxi zones.
- **Recorded trip speeds:** average speeds calculated from trips that pass our quality checks.
- **Zone details:** names, boroughs, and summaries displayed on the map.

The goal is to make patterns in taxi activity and movement easier to explore.

## From raw records to an interactive map

NYC taxi CSV → Python processing → Parquet and CSV exports
→ PostgreSQL → Node.js API → Leaflet dashboard

Our processing pipeline preserves suspicious records with review flags,
rather than silently discarding them. Derived features include trip
duration, average recorded speed, and base fare per mile.

## Built so far

- Processed **7.67 million taxi trip records**.
- Created quality flags, analysis eligibility rules, and audit outputs.
- Prepared database imports and a **10,000-trip development sample**.
- Exported **260 unique taxi zone boundaries** as GeoJSON.
- Documented the data fields and database handoff.

The database, API, and interactive dashboard are the next milestones.

## Database Setup & Handoff Guide

Follow these steps in order to set up, load, and validate the PostgreSQL database.

### 1. Project Overview
This repository builds and manages the PostgreSQL database powering the Urban Mobility Explorer backend. It structures, loads, indexes, and queries **7.67M January 2019 NYC Yellow Taxi records** alongside **265 taxi zone records**.

### 2. Prerequisites
Ensure you have the following installed before starting:
- **PostgreSQL** (v16 or higher)
- **`psql` command-line utility** (included with PostgreSQL)
- **Data CSV Files** (Not tracked in Git):
  - `taxi_zones.csv` (265 zones)
  - `sample_trips.csv` (10,000-row sample for testing) OR `yellow_tripdata_2019-01.csv` (full dataset, 7.67M rows)
  *Obtain raw CSVs from the team shared storage or project data folder.*

### 3. Create the Database
Open your terminal and create the PostgreSQL database:

```bash
psql -U postgres -c "CREATE DATABASE urban_mobility;"
```

### 4. Create Tables
Execute the schema script to create the zones and taxi_trips tables along with foreign key constraints:

```bash
psql -U postgres -d urban_mobility -f schema.sql
```
### 5. Import the Data
Data must be loaded in sequence (zones first, then trips) due to foreign key constraints.
Update the file paths inside import.sql to point to your local CSV locations.

```bash
psql -U postgres -d urban_mobility -f import.sql
```
### 6. Validate Data
Run the validation suite to verify row counts, primary keys, foreign key mapping, boolean fields, and missing value conversions:

```bash
psql -U postgres -d urban_mobility -f validate.sql
```
Expected Results for full import:
    Zones Count: 265

    Total Trips: 7,667,792

    Missing Surcharges: 4,855,978

    Eligible Speed Analysis Trips: 7,585,345

    Unmapped Pickup/Dropoff Zones: 0

### 7, Re-running / Resetting

If an error occurs or you need a clean reset, drop the database and recreate it. Do not run import.sql twice without dropping tables, as it will duplicate rows or cause primary key collision errors. 

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS urban_mobility;"
psql -U postgres -c "CREATE DATABASE urban_mobility;"
```
### 8. Database Indexes 

After confirming validation passes on the full dataset, execute the indexing script to optimize API query repsonse times:


```bash
psql -U postgres -d urban_mobility -f indexes.sql
```
### 9. Query Scripts Reference (API Handoff)

Script File: zone_hour_summary.sql

Target Endpoint / Purpose: GET /api/zones/summary?hour=:target_hour

Parameters: :target_hour (Integer, 0–23)

Output Columns: zone_id, zone_name, borough, pickup_count, eligible_count, mean_speed

### 10. Connection setup & environment variables

The Node.js/Express backend expects the following environment configuration variables. Copy .env.example to .env locally:

Code snippet:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=urban_mobility
DB_USER=postgres
DB_PASSWORD=your_secure_local_password_here



## Technology

| Layer                 | Technology                    |
| --------------------- | ----------------------------- |
| Data processing       | Python, pandas, PyArrow       |
| Geographic processing | GeoPandas                     |
| Database              | PostgreSQL — planned          |
| Backend               | Node.js and Express — planned |
| Interactive map       | Leaflet — planned             |


## Meet Group Zero

| Member   | Responsibility                                   |
| -------- | ------------------------------------------------ |
| Nadiv    | Data processing and backend                      |
| Karyna   | Database design and implementation               |
| Bertha   | Frontend and interactive map                     |
| Everyone | Documentation, testing, and project coordination |

## Working with the data

Small development exports and processing scripts are included in the
repository. Large CSV and Parquet datasets are excluded from Git and
shared separately.

Map boundaries are available at:
`data/processed/taxi_zones.geojson`

## Understanding the results

Recorded trip speed is an indicator of movement, not a direct measurement
of street congestion. Trips are associated with taxi zones; their actual
road routes are unavailable.

The dataset also lacks stable vehicle identifiers, so it cannot directly
measure individual taxis' empty travel between passengers.
