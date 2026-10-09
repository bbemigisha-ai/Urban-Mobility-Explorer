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
