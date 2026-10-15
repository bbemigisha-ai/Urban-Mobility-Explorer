# Urban Mobility Explorer 

Where do NYC taxi trips begin, how quickly do they move, and how does that change throughout the day?

Urban Mobility Explorer is a student-built dashboard for **January 2019 NYC yellow taxi records**. It connects a Python data-processing pipeline, PostgreSQL, an Express API, and a Leaflet dashboard.

## Demo Video
https://www.youtube.com/watch?v=kQfGzPce0o4

## Task Sheet
https://docs.google.com/spreadsheets/d/1EN5RWRRg64OWKpQUlkDSB9PPVTDlkKEdInlZfGUVCr4/edit?usp=sharing

## Trello Board
https://trello.com/invite/b/6ace63dde30372ef975b67e5/ATTI24f0788ad8967629801c5709ab0a4dd4E9A20AA2/summative-urban-mobility-explorer

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

## Prerequisites and terminal conventions

Use **Terminal (bash/zsh) on macOS/Linux** or **PowerShell on Windows**. Commands marked “all platforms” work in either shell. Run each command separately and stop if it reports an error. Paths below are relative to the repository, not a particular team member's computer; quote any path containing spaces.

Install these tools before starting:

| Tool | macOS | Windows | Linux |
| --- | --- | --- | --- |
| Node.js and npm | Install Node.js 24 using the [official download instructions](https://nodejs.org/en/download). | Install Node.js 24 and reopen PowerShell afterward. | Install Node.js 24 using the official instructions for your distribution. |
| PostgreSQL | Use the [PostgreSQL macOS options](https://www.postgresql.org/download/macosx/) and start the installed server. | Use the [Windows installer](https://www.postgresql.org/download/windows/); include command-line tools and remember the database password. | Follow the [PostgreSQL Linux instructions](https://www.postgresql.org/download/linux/) for your distribution and start its database service. |
| Python 3 | Use an installed Python 3 or [python.org](https://www.python.org/downloads/). | Install Python 3 with the `py` launcher available. | Install Python 3, pip, and the venv package using your distribution's package manager. |

Node.js must support `--env-file-if-exists`; this project has been used with Node.js 24. Python processing dependencies are only needed if rebuilding datasets. You also need the data exports (large files are shared separately), and internet access for Leaflet/Chart.js CDN scripts and OpenStreetMap tiles.

Check your tools (all platforms):

```text
node --version
npm --version
psql --version
createdb --version
```

Check Python with `python3 --version` on macOS/Linux or `py -3 --version` on Windows. If Windows has only `python`, verify that it is Python 3 and substitute `python` for `py -3` below.

If `psql` or `createdb` is not found, add your PostgreSQL installation's `bin` directory to PATH and open a new terminal. On Windows it is commonly under `C:\Program Files\PostgreSQL\<installed-version>\bin`; replace the version placeholder with your actual installation. On macOS, follow the PATH instructions for your chosen PostgreSQL installer. Installing the client tools alone does not start a database server.

If PowerShell reports that `npm.ps1` cannot run, use `npm.cmd` wherever these instructions say `npm`; changing the system execution policy is unnecessary.

## 1. Prepare the data

Start in the repository root, the folder containing `README.md`, `backend/`, `database/`, and `frontend/`. **Skip regeneration if you already have the required exports.** The scripts expect the January taxi CSV, zone lookup CSV, and shapefile components under `data/raw/`.

Create an isolated Python environment and install processing dependencies. These commands use its interpreter directly, so shell activation is not required. See the [Python venv documentation](https://docs.python.org/3/library/venv.html).

**macOS/Linux:**

```bash
python3 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install pandas pyarrow pyshp geopandas pyproj
./.venv/bin/python scripts/convert_to_parquet.py
./.venv/bin/python scripts/clean_data.py
./.venv/bin/python scripts/export_database_data.py
./.venv/bin/python scripts/export_zones_geojson.py
```

**Windows PowerShell:**

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install pandas pyarrow pyshp geopandas pyproj
.\.venv\Scripts\python.exe scripts/convert_to_parquet.py
.\.venv\Scripts\python.exe scripts/clean_data.py
.\.venv\Scripts\python.exe scripts/export_database_data.py
.\.venv\Scripts\python.exe scripts/export_zones_geojson.py
```

Keep `.venv/` out of Git; add it to your local `.git/info/exclude` if your Python version does not create an ignore file for it. If Linux reports that `venv` or `ensurepip` is unavailable, install the venv package matching your Python version, then retry environment creation. If a processing library has no compatible wheel, use a Python version supported by that library rather than assuming the newest Python release is supported.

Outputs under `data/processed/` include `trips_full.csv`, `trips_sample.csv`, `zones.csv`, and `taxi_zones.geojson`. The 10,000-row sample contains the first records and is **not representative of the full month**.

The frontend loads boundaries from `frontend/assets/taxi_zones.geojson`. After regenerating them, update that copy from the repository root:

**macOS/Linux:**

```bash
cp data/processed/taxi_zones.geojson frontend/assets/taxi_zones.geojson
```

**Windows PowerShell:**

```powershell
Copy-Item data/processed/taxi_zones.geojson frontend/assets/taxi_zones.geojson
```

## 2. Set up PostgreSQL

Start PostgreSQL using the service/app installed on your operating system. Use an existing PostgreSQL login role that can create a database and owns the tables you will create. It may be your local username on macOS or a role created during installation, often `postgres` on Windows. PostgreSQL roles and operating-system usernames are not necessarily the same.

On Linux installations using peer authentication, your administrator may need to create a password-enabled login role with database-creation permission first. The commands below use TCP (`127.0.0.1`) and the same login as the backend; do not assume `sudo -u postgres psql` credentials automatically apply to Node.js.

Set connection defaults in your current terminal, replacing `your_database_role` with the real role name.

**macOS/Linux:**

```bash
export PGHOST=127.0.0.1
export PGPORT=5432
export PGUSER=your_database_role
```

**Windows PowerShell:**

```powershell
$env:PGHOST = "127.0.0.1"
$env:PGPORT = "5432"
$env:PGUSER = "your_database_role"
```

These settings apply to this terminal session. The client prompts for a password when required. Use your actual port if it differs from 5432. These PostgreSQL tools do **not** automatically read `backend/.env`.

The main setup uses the **full export**. From the repository root, create a new, empty database (**all platforms**):

```text
createdb urban_mobility
psql -d urban_mobility -v ON_ERROR_STOP=1 --single-transaction -f database/schema.sql
```

The import script uses paths relative to `database/`. Run the following on **all platforms**, keeping each command on one line:

```text
cd database
psql -d urban_mobility -v ON_ERROR_STOP=1 --single-transaction -f import.sql
psql -d urban_mobility -v ON_ERROR_STOP=1 -f index.sql
psql -d urban_mobility -v ON_ERROR_STOP=1 -f validate.sql
cd ..
```

`import.sql` uses psql's `\copy` to read local files, imports zones before trips, and names the trip columns explicitly. Its forward-slash relative paths work on all three platforms; run it through `psql`, not a generic SQL query editor. `index.sql` creates indexes and updates database statistics. Expected full-import counts are **265 zones and 7,667,792 trips**. Do not rerun schema creation or imports against populated tables.

For a small development database, use a separate empty database and substitute `trips_sample.csv` for `trips_full.csv` in a local copy of the import script. Expect 10,000 trips. The API's `data_mode` label is hardcoded to `database_full`; it does not detect sample imports automatically.

## 3. Run the backend

From the repository root, on **all platforms**:

```text
cd backend
npm ci
```

If `.env` does not already exist, create it from the example. Do not overwrite an existing configured file.

**macOS/Linux:**

```bash
cp .env.example .env
```

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

Edit `backend/.env` in your editor. It is a plain text configuration file with the **same syntax on all platforms**, not a shell script:

```dotenv
PORT=3000
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=urban_mobility
PGUSER=your_database_role
PGPASSWORD="your_database_password"
```

Replace the role/password placeholders with the database credentials used above, or remove `PGPASSWORD` if your authentication setup does not require it. On Windows, ensure the filename is `.env`, not `.env.txt`. Keep `.env` out of Git. Existing environment variables take precedence over values in the file, so keep terminal connection settings consistent with it.

Start the server and leave this terminal running (**all platforms**):

```text
npm start
```

In PowerShell, `npm.cmd start` is an alternative if the `npm.ps1` launcher is blocked. **Restart after changing server code or summary SQL**: the query is read at startup. Ctrl+C closes the server and database pool.

## 4. Run the frontend

Open a second terminal and navigate to the repository root again. No processing packages or virtual-environment activation are needed to serve the frontend.

**macOS/Linux:**

```bash
python3 -m http.server 5500 --bind 127.0.0.1
```

**Windows PowerShell:**

```powershell
py -3 -m http.server 5500 --bind 127.0.0.1
```

Open [the local dashboard](http://127.0.0.1:5500/frontend/index.html). Leave both terminals running. An editor's Live Server serving the repository root at the same address is another option; only one frontend server should use port 5500.

Use the exact frontend address above: the backend permits origin `http://127.0.0.1:5500`, which differs from `http://localhost:5500`. The frontend API URL is `http://localhost:3000/api`. To change ports or deploy publicly, update `frontend/js/api.js` and CORS in `backend/server.js`. Opening HTML directly as a file is not supported.

### Setup troubleshooting

| Symptom | What to check |
| --- | --- |
| Command not found/not recognized | Install the tool, check PATH, and reopen the terminal. |
| PostgreSQL connection refused | Start the database service and verify host/port. |
| Password authentication failed or role does not exist | Use a real PostgreSQL role and matching credentials in both psql and `.env`. |
| Permission denied creating the database | Use a role with `CREATEDB` permission or ask the database administrator to create a database owned by your role. |
| CSV file not found | Confirm exports exist and run `import.sql` from `database/`. |
| Address/port already in use | Stop the duplicate server or consistently update ports and CORS. |
| API works but dashboard requests fail | Check the browser origin, API URL, and browser console. |
| All Hours takes a while | It currently sends 24 requests; check the visible loading/error message before retrying. |

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

From `backend/` (all platforms):

```text
node check_ranking.js
node --env-file=.env check_db.js
```

These scripts print ranking examples and database-query results for inspection; they are not a comprehensive automated test suite. `npm test` is still a placeholder that exits with an error.

With the backend running, on **macOS/Linux**:

```bash
curl 'http://localhost:3000/api/health'
curl 'http://localhost:3000/api/zones/summary?pickup_hour=8'
curl -i 'http://localhost:3000/api/zones/summary?pickup_hour=24'
```

On **Windows PowerShell**, use `curl.exe` explicitly to avoid the `curl` alias in older PowerShell versions:

```powershell
curl.exe "http://localhost:3000/api/health"
curl.exe "http://localhost:3000/api/zones/summary?pickup_hour=8"
curl.exe -i "http://localhost:3000/api/zones/summary?pickup_hour=24"
```

The last request intentionally uses an invalid hour and should return HTTP 400. If `curl.exe` is unavailable, open the URLs in a browser or use `Invoke-RestMethod` for the successful requests.

These instructions cover macOS, Windows, and Linux; the application checks described below were performed locally on macOS, not independently on all three operating systems.


Earlier full-import validation matched **7,585,345 speed-eligible records** and **4,855,978 missing congestion surcharges**. East Village (location ID 79), hour 8, matched direct SQL: **5,992 pickups, 5,943 speed-eligible trips, and approximately 10.7353 mph**. The local dashboard also showed **7,667,255 January pickups** across All Hours; this differs from the source-row count because the source includes pickups outside January.

The dashboard's filter and empty-state flows have been browser-checked. Controlled checks also exercised out-of-order request completion and simulated API failure/recovery. Direct SQL comparisons for the new fare and distance summaries remain a final validation task.

## Limitations and remaining work

- **All Hours can be slow:** it runs 24 queries, and request tracking ignores stale results without cancelling their underlying requests. Caching or a combined summary endpoint remains a performance improvement.
- Recorded trip speed indicates movement, not directly measured street congestion. Actual road routes and stable vehicle IDs are unavailable, so individual taxis' empty mileage cannot be reconstructed.
- There are 265 lookup zones but 260 mapped zone IDs. Lookup-zone summaries can contribute to cards and rankings without having a visible polygon.
- Speed thresholds are provisional review rules. Extreme positive financial and distance values need further review.

See [the data dictionary](docs/data_dictionary.md) for source fields, derived features, and quality flags.
