# Urban Mobility Explorer 

Where do NYC taxi trips begin, how quickly do they move, and how does that change throughout the day?

Urban Mobility Explorer is a student-built dashboard for **January 2019 NYC yellow taxi records**. It connects a Python data-processing pipeline, PostgreSQL, an Express API, and a Leaflet dashboard.

## Current features

- Processing of **7,667,792 source records**, with typed Parquet storage, derived features, quality-control flags, audit outputs, and database exports.
- Related PostgreSQL trips and zones tables, with hourly summaries for 265 lookup zones.
- A Leaflet map with **260 unique taxi-zone boundaries**, matched to API records by `location_id`.
- Combined pickup-hour, borough, and zone-name filters; Reset restores all controls.
- Pickup, weighted mean speed, average base fare, and average distance cards.
- Map colors and dynamic legends for pickup count, recorded speed, and base fare.
- Selected-zone pickup and speed statistics that refresh with filters and explain excluded selections.
- Highest/lowest five-zone rankings, with hourly records combined by zone before sorting.
- A full-day activity chart for All Hours, or a single bar for a selected hour.
- Hourly activity, borough, speed, and fare insights, plus loading, error, and no-match states.
- Request tracking that prevents older responses from replacing the latest hour selection.

## Architecture and team

```text
NYC taxi CSV → Python processing → Parquet and CSV exports
→ PostgreSQL → Express API → HTML/CSS/JavaScript dashboard
```

| Member   | Responsibility                                      | Main technologies                                    |
| -------- | --------------------------------------------------- | ---------------------------------------------------- |
| Nadiv    | Data processing, geographic processing, and backend | Python, pandas, PyArrow, GeoPandas, Node.js, Express |
| Karyna   | Database design and implementation                  | PostgreSQL                                           |
| Bertha   | Frontend and interactive map                        | HTML, CSS, JavaScript, Leaflet, Chart.js             |
| Everyone | Documentation, testing, and project coordination    | Git and shared project tools                         |

```text
backend/    Express API, database connection, ranking algorithm, and checks
database/  Schema, import, indexes, validation, and hourly summary SQL
frontend/   Dashboard markup, styles, scripts, and map assets
scripts/    Python processing and export scripts
docs/       Data dictionary and documentation
data/       Local datasets, exports, and audit outputs
```

## Prerequisites

- PostgreSQL running locally, with `psql` and `createdb` available.
- Node.js with support for `--env-file-if-exists` (the project has been used with Node.js 24), and npm.
- Python 3; processing libraries are needed only if rebuilding the datasets.
- The data exports, or raw inputs needed to generate them. Large CSV and Parquet files are excluded from Git and shared separately.
- Internet access for the Leaflet/Chart.js CDN scripts and OpenStreetMap tiles.

## 1. Prepare the data

Skip regeneration if you already have the required exports. The scripts expect the January taxi CSV, zone lookup CSV, and shapefile components under `data/raw/`.

Install processing dependencies:

```bash
python3 -m pip install pandas pyarrow pyshp geopandas pyproj
```

Run from the repository root:

```bash
python3 scripts/convert_to_parquet.py
python3 scripts/clean_data.py
python3 scripts/export_database_data.py
python3 scripts/export_zones_geojson.py
```

Outputs under `data/processed/` include `trips_full.csv`, `trips_sample.csv`, `zones.csv`, and `taxi_zones.geojson`. The 10,000-row sample contains the first records and is **not representative of the full month**.

The frontend loads its boundaries from `frontend/assets/taxi_zones.geojson`. If you regenerate the geographic export, update that copy too:

```bash
cp data/processed/taxi_zones.geojson frontend/assets/taxi_zones.geojson
```

## 2. Set up PostgreSQL

The main setup uses the **full export**. On a new, empty database, run these commands from the repository root:

```bash
createdb urban_mobility
psql -d urban_mobility -v ON_ERROR_STOP=1 --single-transaction -f database/schema.sql
```

The import script uses paths relative to `database/`, so run it from that directory:

```bash
cd database
psql -d urban_mobility -v ON_ERROR_STOP=1 --single-transaction -f import.sql
psql -d urban_mobility -v ON_ERROR_STOP=1 -f index.sql
psql -d urban_mobility -v ON_ERROR_STOP=1 -f validate.sql
cd ..
```

`import.sql` imports zones first, then the full trips export using explicit columns. `index.sql` creates pickup-hour and pickup-zone indexes and updates database statistics. Expected full-import counts are **265 zones and 7,667,792 trips**. Do not rerun schema creation or imports against populated tables.

For a small development database, use a separate empty database and substitute `trips_sample.csv` for `trips_full.csv` in a local copy of the import script. Expect 10,000 trips. The API's `data_mode` label is currently hardcoded to `database_full`; it does not detect sample imports automatically.

## 3. Run the backend

From the repository root:

```bash
cd backend
npm ci
cp .env.example .env
```

Edit `backend/.env` for your local PostgreSQL installation:

```dotenv
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=urban_mobility
PGUSER=your_local_postgres_user
```

Set `PGPASSWORD` if required by your PostgreSQL authentication configuration; replace or remove the example password placeholder. Keep `.env` out of Git.

Start the server and leave the terminal running:

```bash
npm start
```

The start command loads `.env`. **Restart the backend after changing server code or the summary SQL**: the query file is read at startup. Control+C closes the HTTP server and database pool.

## 4. Run the frontend

In a second terminal, from the repository root:

```bash
python3 -m http.server 5500 --bind 127.0.0.1
```

Open [the local dashboard](http://127.0.0.1:5500/frontend/index.html). Serving the repository root with an editor's Live Server on the same address is another option; run only one server on port 5500.

The frontend API URL is currently `http://localhost:3000/api`, and the backend allows the frontend origin `http://127.0.0.1:5500`. If you change ports or deploy the project, update `frontend/js/api.js` and the CORS configuration in `backend/server.js`. Opening the HTML directly as a file is not the supported setup.

## API

| Endpoint                           | Purpose                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `/api/health`                      | Server health response; does not query PostgreSQL                       |
| `/api/zones/summary?pickup_hour=8` | January summaries and top-ten pickup zones for one hour                 |
| `/data/taxi_zones.geojson`         | Geographic boundaries; the frontend currently uses its local asset copy |

The summary requires an integer hour from 0 to 23. Invalid hours return HTTP 400, unknown API routes return HTTP 404, and database-query failures return HTTP 500.

A summary contains `metadata`, `zones`, and `top_zones`. Metadata identifies `yellow_tripdata_2019-01`, the requested hour, and `database_full`.

| Zone field                                      | Meaning                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| `location_id`, `zone_name`, `borough`           | Zone identity                                                     |
| `pickup_count`                                  | January pickups in that zone and hour                             |
| `eligible_speed_count`, `mean_trip_speed_mph`   | Eligible trip count and average recorded speed in mph             |
| `eligible_fare_count`, `mean_base_fare`         | Nonnegative fare count and average base fare in USD               |
| `eligible_distance_count`, `mean_trip_distance` | Nonnegative distance count and average recorded distance in miles |

Counts and averages are serialized as JSON numbers; unavailable averages remain `null`. The left join retains lookup zones with zero pickups.

**All Hours is a frontend operation**, not an API parameter. It sends 24 hourly requests and combines their records: 265 zones × 24 hours = 6,360 zone-hour records. The frontend adds `pickup_hour` to each record. Its All Hours wrapper currently retains the combined zones, rather than the individual response metadata and top-ten lists.

## Metric definitions

All summary queries restrict pickups to January 2019. Hours describe the dataset's NYC local pickup timestamps.

| Metric              | Included records                                                                                                      | Unit           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------- |
| Pickup count        | All matching January pickups                                                                                          | Trips          |
| Mean recorded speed | Positive distance and duration; duration at most 180 minutes; speed at most 80 mph; `eligible_speed_analysis` is true | mph            |
| Mean base fare      | Nonmissing `fare_amount` greater than or equal to zero                                                                | USD per trip   |
| Mean distance       | Nonmissing `trip_distance` greater than or equal to zero                                                              | Miles per trip |

Fare and distance include zero values and use their own eligibility rules, independent of speed. Negative values are retained in the source data but excluded from those averages. Extreme positive fare and distance values are not removed by these summary rules.

Across zones or hours, the dashboard uses **count-weighted means**:

```text
combined mean = sum(group mean × eligible group count)
                ÷ sum(eligible group count)
```

Each metric uses its own eligible count. Missing means do not become measured zeros. No matching records display a dash or explanatory message.

**Base fare per trip differs from base fare per mile.** The processing pipeline also derives `fare_per_mile`, but the dashboard's fare card, map, and insight show base fare per trip, excluding tips and additional charges.

Map color bands are display choices, not congestion or risk classifications:

- Pickups: 0; 1–999; 1,000–9,999; 10,000–49,999; 50,000+.
- Speed: below 10; 10 to below 15; 15 to below 20; 20+ mph.
- Base fare: below $10; $10 to below $15; $15 to below $20; $20+.

Faint zones are excluded by filters or lack eligible data. Gray represents zero pickups or unavailable mean values, depending on the selected metric.

## Ranking algorithm

The **backend** manually implements stable insertion sort on a copy of the hourly zone summaries and returns the ten highest pickup counts. Best-case time is O(n); average/worst-case time is O(n²). The algorithm uses O(1) temporary sorting space, plus O(n) for the copied array. It sorts zone summaries, not millions of individual trips.

The **frontend** first combines hourly pickup counts by `location_id`, then uses JavaScript's built-in `.sort()` to display the five highest or lowest zones within the current filters. It does not currently use the API's `top_zones` list for its displayed ranking. Review this distinction against the assignment's algorithm requirements.

## Verification

From `backend/`:

```bash
node check_ranking.js
node --env-file=.env check_db.js
```

These scripts print ranking examples and database-query results for inspection; they are not a comprehensive automated test suite. `npm test` is still a placeholder that exits with an error.

With the backend running:

```bash
curl 'http://localhost:3000/api/health'
curl 'http://localhost:3000/api/zones/summary?pickup_hour=8'
curl -i 'http://localhost:3000/api/zones/summary?pickup_hour=24'
```

Earlier full-import validation matched **7,585,345 speed-eligible records** and **4,855,978 missing congestion surcharges**. East Village (location ID 79), hour 8, matched direct SQL: **5,992 pickups, 5,943 speed-eligible trips, and approximately 10.7353 mph**. The local dashboard also showed **7,667,255 January pickups** across All Hours; this differs from the source-row count because the source includes pickups outside January.

The dashboard's filter and empty-state flows have been browser-checked. Controlled checks also exercised out-of-order request completion and simulated API failure/recovery. Direct SQL comparisons for the new fare and distance summaries remain a final validation task.

## Limitations and remaining work

- **All Hours can be slow:** it runs 24 queries, and request tracking ignores stale results without cancelling their underlying requests. Caching or a combined summary endpoint remains a performance improvement.
- Recorded trip speed indicates movement, not directly measured street congestion. Actual road routes and stable vehicle IDs are unavailable, so individual taxis' empty mileage cannot be reconstructed.
- There are 265 lookup zones but 260 mapped zone IDs. Lookup-zone summaries can contribute to cards and rankings without having a visible polygon.
- Speed thresholds are provisional review rules. Extreme positive financial and distance values need further review.

See [the data dictionary](docs/data_dictionary.md) for source fields, derived features, and quality flags.
