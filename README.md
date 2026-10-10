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
