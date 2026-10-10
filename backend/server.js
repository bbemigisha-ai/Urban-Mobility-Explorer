import express from "express"
import { error } from "node:console";
import path from "node:path"
import { fileURLToPath } from "node:url";


const app = express();
const port = process.env.PORT || 3000; 

//process.env.port allows for a configurable port in case 3000 is occupied
//to configure port on terminal => "PORT=3001 npm start"



const zonesFile = fileURLToPath(
    new URL("../data/processed/taxi_zones.geojson", import.meta.url)
)

function healthHandler(req, res){
    res.json({status: "ok"});
}

app.get("/api/health", healthHandler);
app.get("/api/zones/summary", function (req, res){
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
    
    res.json({
        metadata: {
            dataset: "yellow_tripdata_2019-01",
            pickup_hour: hour, 
            data_mode: "fixture"
        },
        zones: [ //test values
            {
                location_id: 1, 
                zone_name: "Newark Airport", 
                borough: "EWR", 
                pickup_count: 120, 
                eligible_speed_count: 100,
                mean_trip_speed_mph: 18.5, 
                
            }, 
            {
                location_id: 2, 
                zone_name: "Jamaica Bay", 
                borough: "Queens", 
                pickup_count: 0, 
                eligible_speed_count: 0,
                mean_trip_speed_mph: null, 

            },
            {
                location_id: 3, 
                zone_name: "Allerton/Pelham Gardens", 
                borough: "Bronx", 
                pickup_count: 15, 
                eligible_speed_count: 0,
                mean_trip_speed_mph: null,
            }
        ]
    });

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

app.listen(port, function(){
    console.log("Server running at http://localhost: " + port)
});

