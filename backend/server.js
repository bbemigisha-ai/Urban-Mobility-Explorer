import express from "express"
import { fileURLToPath } from "node:url";
import pool from "./db.js";
import { readFile } from "node:fs/promises";


const app = express();
const port = process.env.PORT || 3000; 

//process.env.port allows for a configurable port in case 3000 is occupied
//to configure port on terminal => "PORT=3001 npm start"


// load sql

const summaryQuery = await readFile(
    new URL("../database/zone_hour_summary.sql", import.meta.url), "utf-8"
)


const zonesFile = fileURLToPath(
    new URL("../data/processed/taxi_zones.geojson", import.meta.url)
)

function healthHandler(req, res){
    res.json({status: "ok"});
}

app.get("/api/health", healthHandler);
app.get("/api/zones/summary", async function (req, res){ //async allows handler to use await for database requests
    const pickupHour = req.query.pickup_hour;    

    if (
        typeof pickupHour !== "string" || 
        !/^(?:[01]?[0-9]|2[0-3])$/.test(pickupHour)
    ){
        return res.status(400).json({
            error: "pickup_hour must be an an integer from 0 to 23"
        });
    }
    const hour = Number(pickupHour);
    
    try {
        const result = await pool.query(summaryQuery, [hour]);

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

    res.json({
        metadata: {
            dataset: "yellow_tripdata_2019-01",
            pickup_hour: hour, 
            data_mode: "database_full"
        },
        zones: zones
    });
} catch (error){
    console.error("Zone summary query failed: ", error.message);

    res.status(500).json({
        error: "Unable to load zone summaries"
    });
}
});



app.get("/data/taxi_zones.geojson", function (req,res){
    res.sendFile(zonesFile); //send existing file as result
});

// checks for invalid or non-existent api routes
app.use("/api", function (req,res){
    res.status(404).json({
        error:"API route not found"
    });
});

const server = app.listen(port, function (){
    console.log("Server running at http://localhost: " + port);
});

process.on ("SIGINT", function (){
    console.log("Shutting down. . . ");

    server.close(async function () {
        try{
            await pool.end();
            console.log("Server and database pool closed.");
        } catch (error){
            console.error("Shutdown failed: ", error.message);
            process.exitCode = 1;
        }
    });
});