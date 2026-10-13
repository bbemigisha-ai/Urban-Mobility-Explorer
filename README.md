# Urban Mobility Explorer 🚕🗽

Where do NYC taxi trips begin, how quickly do they move, and how does that change throughout the day?

Urban Mobility Explorer is a student-built dashboard that turns **January 2019 NYC yellow taxi records** into an interactive map of urban movement.

## What's been built

- A Python pipeline processing **7.67 million taxi trip records**, with typed Parquet storage, QC flags, audit outputs and DB exports.
- 3 derived featuers: trip duration, average recorded speed & base fare per mile.
- PostgreSQL DB with related trips and zones tables.
- An Express API returning hourly summaries and manually sorted top-ten pickup zones.
- GeoJSON containing **260 unique taxi-zone boundaries**, converted to longitude and latitude and checked for proper valid geometry.
- Frontend layout with a Leaflet map, zone boundaries and clickale zone names.

## Architecture

```text
NYC taxi CSV → Python processing → Parquet and CSV exports
→ PostgreSQL → Node.js API → Leaflet dashboard
```

API summaries and geo features are matched using `location_id`

## Team and Tech

| Member   | Responsibility                                   | Layer                 | Technology              |
| -------- | ------------------------------------------------ | --------------------- | ----------------------- |
| Nadiv    | Data processing and backend                      | Data processing       | Python, pandas, PyArrow |
|          |                                                  | Geographic Processing | GeoPandas               |
| Karyna   | Database design and implementation               | Database              | PostgreSQL              |
| Bertha   | Frontend and interactive map                     | Frontend              | HTML, CSS, JS, Leaflet  |
| Everyone | Documentation, testing, and project coordination |

## Repo Structure

```text
backend/    API, DB connection, ranking algorithm, and checks
database/   Schema, imports, validation, and summary queries
frontend/   Dashboard layout, styles, and map interaction
scripts/    Python processing and export scripts
docs/       Data dicts and documentation
data/       Local datasets, exports and audit outpouts
```

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

## Prepare the data

Large CSV and Parquet files are excluded from Git and shared separately.
The pipeline expects the trip CSV, zone lookup, and shapefile components
under `data/raw/`.

Install processing dependencies:

```bash
python3 -m pip install pandas pyarrow pyshp geopandas pyproj
```

Run from the project root:

```bash
python3 scripts/convert_to_parquet.py
python3 scripts/clean_data.py
python3 scripts/export_database_data.py
python3 scripts/export_zones_geojson.py
```

The exports include `trips_sample.csv`, `trips_full.csv`, `zones.csv`,
and `taxi_zones.geojson` under `data/processed/`. The sample contains the
first 10,000 records and is not representative of the full month.

## Set up PostgreSQL

With PostgreSQL running, execute from the project root:

## Running the backend locally

The backend uses Node.js, Express, and PostgreSQL. It currently queries
a 10,000-trip development sample, not the full January dataset.

### 1. Install dependencies

From the project root:

    cd backend
    npm ci

### 2. Configure local settings

Copy `.env.example` to `.env` inside `backend/` and update:

    PORT=3000
    PGHOST=localhost
    PGPORT=5432
    PGDATABASE=urban_mobility
    PGUSER=your_local_postgres_user

Set `PGPASSWORD` if your PostgreSQL configuration requires one.
Keep `.env` out of Git. The start command loads it automatically.

### 3. Prepare the database

Ensure PostgreSQL is running. From the project root, create the database:

    createdb urban_mobility

Run the schema on the new, empty database:

    psql -d urban_mobility -v ON_ERROR_STOP=1 --single-transaction -f database/schema.sql

Open PostgreSQL from the project root:

    psql -d urban_mobility

Import zones first, then the sample. Run each command on one line:

    \copy zones(location_id, borough, zone_name, service_zone) FROM 'data/processed/zones.csv' WITH (FORMAT csv, HEADER true, NULL '\N');

    \copy trips FROM 'data/processed/trips_sample.csv' WITH (FORMAT csv, HEADER true, NULL '\N');

The trips import relies on the schema matching the CSV column order.
Expected counts are 265 zones and 10,000 trips. Do not repeat the imports
against already-populated tables.

Validate the import:

    \i database/validate.sql

Exit PostgreSQL with `\q`.

### 4. Start the server

From `backend/`:

    npm start

The default port is 3000; `.env` can override it.

| Endpoint                           | Purpose                                                |
| ---------------------------------- | ------------------------------------------------------ |
| `/api/health`                      | Server health response                                 |
| `/api/zones/summary?pickup_hour=0` | January pickup counts and eligible mean speeds by zone |
| `/data/taxi_zones.geojson`         | 260 unique zone boundaries for Leaflet                 |

Open endpoints at `http://localhost:3000`, or use your configured port.

### Behavior and verification

- The pickup hour must be an integer from 0 to 23.
- Invalid hours return HTTP 400.
- Unknown API routes return HTTP 404.
- Database query failures return HTTP 500.
- Unavailable mean speeds remain JSON `null`.
- Responses are labelled `database_sample`.
- Control+C closes the HTTP server and database connection pool.

A direct SQL comparison for East Village (location ID 79), pickup hour 0,
matched the API: 469 pickups, 464 eligible trips, and approximately
10.7649 mph mean recorded speed.

These values describe the development sample and are not full-month findings.

## Ranking algorithm

A manually implemented **insertion sort** ranks zone summaries by
pickup count. It preserves equal-count order and sorts a copy so the
original map response remains unchanged.

Best-case time is O(n); average/worst-case time is O(n²). Sorting uses
O(1) temporary space, while the copied array requires O(n) space.
The algorithm processes 265 summaries, not individual trips.

From `backend/`, run:

```bash
node check_ranking.js
node --env-file=.env check_db.js
```

## Validation and limitations

The full import matched the expected **7,585,345 speed-eligible records**
and **4,855,978 missing congestion surcharges**. East Village at hour 8
matched direct SQL results: **5,992 pickups, 5,943 eligible trips, and
approximately 10.7353 mph**. A subsequent local API request took about
1.13 seconds; the initial request took about 43 seconds.

Records are retained with QC flags. Speed eligibility requires
positive distance and duration, a January pickup, duration at most
180 minutes, and speed at most 80 mph. These thresholds are provisional.
Extreme positive financial values require further review.

There are 265 lookup zones but only 260 mapped IDs. Recorded speeds
indicate movement rather than directly measured congestion. Actual
routes and stable vehicle IDs are unavailable, so empty taxi mileage
cannot be reconstructed directly.

See `docs/data_dictionary.md` for field definitions.
