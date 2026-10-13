// Test zone objects

import { rankZonesByPickups } from "./rank_zones.js";

const zones= [
    {location_id: 1, pickup_count: 15}, 
    {location_id: 2, pickup_count: 120}, 
    {location_id: 3, pickup_count: 80}, 

];

const ranked = rankZonesByPickups(zones);


console.log("Original: ", zones);
console.log("Ranked: ", ranked);

console.log("Empty: ", rankZonesByPickups([]));

console.log(
    "One zone: ", rankZonesByPickups([{location_id: 1, pickup_count: 15}])
);

console.log(
    "Equal conuts: ", rankZonesByPickups([
        {location_id: 1, pickup_count: 80}, 
        {location_id: 2, pickup_count: 120}, 
        {location_id: 3, pickup_count: 80}, 
    ])
);