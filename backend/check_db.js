import pool from "./db.js"
import { readFile } from "node:fs/promises"
try{
    const query = await readFile(
        new URL("../database/zone_hour_summary.sql", import.meta.url), 
        "utf-8"
    );

    const result = await pool.query(query, [0]);

    console.log("Returned zones: ", result.rows.length);
    console.log(result.rows.slice(0, 3));


    const zones = result.rows.map(function (row){ // produce new array by transforming each row
        return{
            ...row, //copies existing fields
            pickup_count: Number(row.pickup_count),
            eligible_speed_count: Number(row.eligible_speed_count), 
            mean_trip_speed_mph:
                row.mean_trip_speed_mph === null
                ? null
                :Number(row.mean_trip_speed_mph)
        };
    
    });
    console.log(zones.slice(0, 3))

} catch(error){
    console.error("Database connection failed: ", error.message)
    process.exitCode = 1;

} finally {
    await pool.end();
}


