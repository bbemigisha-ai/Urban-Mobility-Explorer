let zoneData = []
let hourlyChart = null;

const hourFilter = document.getElementById("hourFilter");
const boroughFilter = document.getElementById("boroughFilter");
const metricFilter = document.getElementById("metricFilter");
const resetFilters = document.getElementById("resetFilters");
const searchInput = document.getElementById("searchinput");
const sortFilter = document.getElementById("sortFilter");

async function loadDashboard() {
    try {
        const selectedHour = hourFilter.value;

        console.log("Loading dashboard data...");

        const data = await getZoneSummary(selectedHour);

        console.log("API data:", data);

        zoneData = data.zones;

        updateDashboard(zoneData);

    } catch (error) {
        console.error("Dashboard loading error:", error);
    }
}

function updateDashboard(data) {
    const selectedBorough = boroughFilter.value;

    let filteredData = data;

    if (selectedBorough !== "all") {
        filteredData = data.filter(zone =>
            zone.borough === selectedBorough
        );
    }
    
    updateMapData(filteredData);
    updateKPIs(filteredData);
    updateRanking(filteredData);
    updateHourlyChart(filteredData);
    updateInsights(filteredData);
}

function updateInsights(data) {
    const busiestHours = document.getElementById("busiestHours");

    if (!data.length) {
        busiestHours.textContent = "No data available";
        return;
    }

    const hourlyTotals = {};

    data.forEach(zone => {
        const hour = Number(zone.pickup_hour);
        const pickups = Number(zone.pickup_count || 0);

        if (!isNaN(hour)) {
            hourlyTotals[hour] = (hourlyTotals[hour] || 0) + pickups;
        }
    });

    const busiestHour = Object.entries(hourlyTotals)
        .sort((a, b) => b[1] - a[1])[0];

    if (!busiestHour) {
        busiestHours.textContent = "No data available";
        return;
    }

    const hour = Number(busiestHour[0]);

    const formattedHour = new Date(2000, 0, 1, hour)
        .toLocaleTimeString([], {
            hour: "numeric"
        });

    busiestHours.textContent =
        `${formattedHour} with ${Number(busiestHour[1]).toLocaleString()} pickups`;

    const busiestBorough = document.getElementById("busiestBorough");
    const boroughTotals = {};
    data.forEach(zone => {
        const borough = zone.borough || "Unknown";
        const pickups = Number(zone.pickup_count || 0);
        
        boroughTotals[borough] =
        (boroughTotals[borough] || 0) + pickups;
    });
    
    const topBorough = Object.entries(boroughTotals)
    .sort((a, b) => b[1] - a[1])[0];
    
    if (topBorough) {
        busiestBorough.textContent =
        `${topBorough[0]} with ${Number(topBorough[1]).toLocaleString()} pickups`;
    
    } else {
        busiestBorough.textContent = "No data available";
    }

    const speedInsight = document.getElementById("speedInsight");

    const averageSpeed = calculateMeanSpeed(data);

    speedInsight.textContent = averageSpeed === null
        ? "No Speed data available"
        : `Average recorded speed is ${averageSpeed.toFixed(1)} mph`;

    const fareInsight = document.getElementById("fareInsight");
    const averageFare = calculateMeanFare(data);

    fareInsight.textContent = averageFare === null
        ? "No fare data available"
        : `Average base fare trip is $${averageFare.toFixed(2)}`;
}

function calculateMeanSpeed(data){
    let weightedSpeedTotal = 0
    let eligibleTripTotal = 0

    for (const zone of data){
        const speed = zone.mean_trip_speed_mph;
        const count = Number(zone.eligible_speed_count);

        if (speed !== null && Number.isFinite(Number(speed)) && count > 0){
            weightedSpeedTotal += Number(speed) * count;
            eligibleTripTotal += count;
        }
    }

    if (eligibleTripTotal > 0){
        return weightedSpeedTotal / eligibleTripTotal
    } else {
        return null
    }

}

function calculateMeanFare(data){
    let weightedFareTotal = 0
    let eligibleFareTotal = 0


    for (const zone of data){
        const fare  = zone.mean_base_fare;
        const count = Number(zone.eligible_fare_count);

        if (fare !== null && Number.isFinite(Number(fare)) && count > 0){
            weightedFareTotal += Number(fare) * count;
            eligibleFareTotal += count;
        }
    }

    if (eligibleFareTotal > 0){
        return weightedFareTotal / eligibleFareTotal
    } else {
        return null
    }

}


 function calculateMeanDistance(data){
    let weightedDistanceTotal = 0
    let eligibleDistanceTotal = 0

    for (const zone of data){
        const distance  = zone.mean_trip_distance;
        const count = Number(zone.eligible_distance_count);

        if (distance !== null && Number.isFinite(Number(distance)) && count > 0){
            weightedDistanceTotal += Number(distance) * count;
            eligibleDistanceTotal += count;
        }
    }

    if (eligibleDistanceTotal > 0){
        return weightedDistanceTotal / eligibleDistanceTotal
    } else {
        return null
    }
    
 }



function updateKPIs(data) {
    const totalPickups = data.reduce((total, zone) =>{
        return total + Number(zone.pickup_count || 0);
    }, 0);

    document.getElementById("totalPickups").textContent =
        totalPickups.toLocaleString();

    const averageSpeed = calculateMeanSpeed(data);

    document.getElementById("averageSpeed").textContent =
        averageSpeed === null
        ? "-"
        :`${averageSpeed.toFixed(1)} mph`;

    const averageDistance = calculateMeanDistance(data);
    document.getElementById("averageDistance").textContent = 
        averageDistance === null
        ? "-"
        : `${averageDistance.toFixed(2)} miles`;
     
    const averageFare = calculateMeanFare(data);

    document.getElementById("averageFare").textContent = 
        averageFare === null
        ? "-"
        :`$${averageFare.toFixed(2)} `;
}

function aggregateZones(data){
    const zonesById = new Map();

    for (const zone of data) {
        const zoneId = zone.location_id;


        // prevent later hours from resetting an existing zone's total
        if (!zonesById.has(zoneId)) {
            zonesById.set(zoneId, {
                location_id: zoneId,
                zone_name: zone.zone_name,
                borough: zone.borough,
                pickup_count: 0
            });
        }
        
        // add each hourly record pickup to zone's total
        const combinedZone = zonesById.get(zoneId);
        combinedZone.pickup_count += Number(zone.pickup_count || 0)
    }

    return Array.from(zonesById.values());
}

function updateRanking(data) {
    const rankingContainer = document.getElementById("zoneRanking");

    const sortDirection = sortFilter.value;
    
    const sortedZones = aggregateZones(data)
    .sort((a, b) => {
        const pickupA = Number(a.pickup_count || 0);
        const pickupB = Number(b.pickup_count || 0);
        
        return sortDirection === "desc"
            ? pickupB - pickupA
            : pickupA - pickupB;
        })
        
        .slice(0, 5);
        
    rankingContainer.innerHTML = "";

    sortedZones.forEach((zone, index) => {
        const item = document.createElement("div");

        item.className = "ranking-item";

        item.innerHTML = `
            <div class="ranking-number">${index + 1}</div>

            <div class="ranking-info">
                 <h3>${zone.zone_name || "Unknown Zone"}</h3>
                 <p>${zone.borough || "Unknown Borough"}</p>
            </div>

            <strong> 
                ${Number(zone.pickup_count || 0).toLocaleString()}
            </strong>
        `;

        rankingContainer.appendChild(item);
    });
}

function updateHourlyChart(data) {
    const hourlyTotals = Array(24).fill(0);

    data.forEach(zone => {
        const hour = Number(zone.pickup_hour);

        if (hour >= 0 && hour <= 23) {
            hourlyTotals[hour] += Number(zone.pickup_count || 0);
        }
    });

    const labels = [
        "12 AM", "1 AM", "2 AM", "3 AM",
        "4 AM", "5 AM", "6 AM", "7 AM",
        "8 AM", "9 AM", "10 AM", "11 AM",
        "12 PM", "1 PM", "2 PM", "3 PM",
        "4 PM", "5 PM", "6 PM", "7 PM",
        "8 PM", "9 PM", "10 PM", "11 PM"
    ];

    const canvas = document.getElementById("hourlyChart");

    if (hourlyChart) {
        hourlyChart.destroy();
    }

    hourlyChart = new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Taxi Pickups",

                data: hourlyTotals,

                borderWidth: 3,

                tension: 0.3,

                fill: false
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


function getPickupColor(count) {
    if (count === 0) return "#737373";
    if (count < 1000) return "#ffffb2";
    if (count < 10000) return "#fecc5c";
    if (count < 50000) return "#fd8d3c";

    return "#e31a1c";
}

function getSpeedColor(speed){
    if (speed === null) return "#737373";
    if (speed < 10) return "#ffffcc";
    if (speed < 15) return "#a1dab4";
    if (speed < 20) return "#41b6c4";

    return "#225ea8";
}

function getFareColor(fare){
    if (fare === null) return "#737373";
    if (fare < 10) return "#eff3ff";
    if (fare < 15) return "#bdd7e7";
    if (fare < 20) return "#6baed6";
    return "#2171b5";
}

function updateMapMetric(metric) {
    if (!window.taxiZoneLayer) {
        return;
    }

    window.taxiZoneLayer.eachLayer(layer => {

        const zone = layer.feature.properties;

        const zoneId = 
            zone.LocationID ||
            zone.location_id ||
            zone.zone_id;

        const matchingZones = mapzoneData.filter(record => String(record.location_id) === String(zoneId));

        let value = 0;

        if (metric === "pickups") {
            value = matchingZones.reduce((total, record) => total + Number(record.pickup_count || 0),
            0
        );
    }

        if (metric === "speed"){
            value = calculateMeanSpeed(matchingZones)
        }
        if (metric === "fare"){
            value = calculateMeanFare(matchingZones);
        }

        if (metric === "pickups"){
            layer.setStyle({
                fillColor: matchingZones.length
                ? getPickupColor(value)
                : "#737373",
            fillOpacity: matchingZones.length ? 0.65 : 0.15
            });
        } else if (metric === "speed"){
            layer.setStyle({
                fillColor: getSpeedColor(value),
                fillOpacity: matchingZones.length && value !== null ? 0.65 : 0.15
            });
        } else if (metric === "fare"){
            layer.setStyle({
                fillColor: getFareColor(value),
                fillOpacity:
                    matchingZones.length && value !== null ? 0.65 : 0.15
            });
        } else {
            layer.setStyle({
                fillColor: "#737373",
                fillOpacity: 0.15
            });
        }

    });
}
hourFilter.addEventListener("change", loadDashboard);

metricFilter.addEventListener("change", function() {
    updateMapMetric(metricFilter.value);
});

boroughFilter.addEventListener("change", function() {
    updateDashboard(zoneData);
});

resetFilters.addEventListener("click", function() {
    hourFilter.value = "all";
    boroughFilter.value = "all";
    metricFilter.value = "pickups";

    loadDashboard();
});

searchInput.addEventListener("input", function() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    const filteredData = zoneData.filter(zone =>
        (zone.zone_name || "").toLowerCase().includes(searchTerm)
    );

    updateDashboard(filteredData);
});

sortFilter.addEventListener("change", function() {
    updateRanking(zoneData);
});

loadDashboard();