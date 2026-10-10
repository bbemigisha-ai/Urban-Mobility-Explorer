import express from "express"

const app = express();
const port = 3000;

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
            error: "pickup_hour must be an an integer from 0 - 23"
        });
    }
    const hour = Number(pickupHour);
    
    res.json({
        metadata: {
            dataset: "yellow_tripdata_2019-01",
            pickup_hour: hour, 
            data_mode: "fixture"
        },
        zones: [
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

            }
        ]
    });

});

app.listen(port, function(){
    console.log("Server running at http://localhost: " + port)
});

