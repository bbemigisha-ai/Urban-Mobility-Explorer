let zoneData = [];
let currentFilteredData = [];
let hourlyChart = null;
let boroughChart = null;
let speedChart = null;

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

    updateKPIs(filteredData);
    updateRanking(filteredData);
    updateHourlyChart(filteredData);
    updateInsights(filteredData);
    updateBoroughChart(filteredData);
    updateSpeedChart(filteredData);

    currentFilteredData = filteredData;
    updateMapMetric(metricFilter.value, filteredData)
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
    const speeds = data
    .map(zone => Number(zone.mean_trip_speed_mph))
    .filter(speed => !isNaN(speed) && speed > 0);
    
    if (speeds.length) {
        const averageSpeed =
        
        speeds.reduce((a, b) => a + b, 0) / speeds.length;
        
        speedInsight.textContent =
        
        `Average recorded speed is ${averageSpeed.toFixed(1)} mph`;
    } else {
        speedInsight.textContent = "No speed data available";
    }

    const fareInsight = document.getElementById("fareInsight");
    const fares = data
    .map(zone => Number(zone.base_fare_per_mile))
    .filter(fare => !isNaN(fare) && fare > 0);
    
    if (fares.length) {
        const averageFare =
        fares.reduce((a, b) => a + b, 0) / fares.length;
        
        fareInsight.textContent =
        `Average base fare per mile is $${averageFare.toFixed(2)}`;
    } else {
        fareInsight.textContent = "No fare data available";
    }
}

function updateKPIs(data) {
    const totalPickups = data.reduce((total, zone) =>{
        return total + Number(zone.pickup_count || 0);
    }, 0);

    document.getElementById("totalPickups").textContent =
        totalPickups.toLocaleString();

    const speeds = data 
        .map(zone => Number(zone.mean_trip_speed_mph))
        .filter(speed => !isNaN(speed) && speed > 0);

    const averageSpeed = speeds.length
        ?speeds.reduce((a,b) => a + b, 0) / speeds.length
        : 0;

    document.getElementById("averageSpeed").textContent =
        `${averageSpeed.toFixed(1)} mph`;

    document.getElementById("averageDistance").textContent = "—";
     
    document.getElementById("averageFare").textContent = "—";   
}

function updateRanking(data) {
    const rankingContainer = document.getElementById("zoneRanking");

    const sortDirection = sortFilter.value;
    
    const sortedZones = [...data]
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

function updateBoroughChart(data) {
    
    const boroughTotals = {};

    data.forEach(zone => {

        const borough = zone.borough || "Unknown";
        const pickups = Number(zone.pickup_count || 0);

        boroughTotals[borough] =
            (boroughTotals[borough] || 0) + pickups;
    });

    const boroughs = [
        "Manhattan",
        "Brooklyn",
        "Queens",
        "Bronx",
        "Staten Island"
    ];

    boroughs.sort((a,b) =>
        (boroughTotals[b] || 0) - (boroughTotals[a] || 0)
    );

    const pickupTotals = boroughs.map(
        borough => boroughTotals[borough]
    );

    const canvas = document.getElementById("boroughChart");

    if (!canvas) {
        return;
    }

    if (boroughChart) {
        boroughChart.destroy();
    }

    boroughChart = new Chart(canvas, {

        type: "bar",

        data: {
            labels: boroughs,

            datasets: [{
                label: "Taxi Pickups",
                data: pickupTotals,
                borderWidth: 1
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

function updateSpeedChart(data) {

    const hourlySpeeds = {};
    const hourlyCounts = {};

    data.forEach(zone => {

        const hour = Number(zone.pickup_hour);
        const speed = Number(zone.mean_trip_speed_mph);
        const pickups = Number(zone.pickup_count || 0);

        if (
            hour >= 0 &&
            hour <= 23 &&
            !isNaN(speed) &&
            speed > 0
        ) {
            hourlySpeeds[hour] =
                (hourlySpeeds[hour] || 0) + (speed * pickups);

            hourlyCounts[hour] =
                (hourlyCounts[hour] || 0) + pickups;
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

    const speedValues = labels.map((_, hour) => {

        if (!hourlyCounts[hour]) {
            return null;
        }

        return (
            hourlySpeeds[hour] /
            hourlyCounts[hour]
        ).toFixed(1);
    });

    const canvas = document.getElementById("speedChart");

    if (!canvas) {
        return;
    }

    if (speedChart) {
        speedChart.destroy();
    }

    speedChart = new Chart(canvas, {

        type: "line",

        data: {
            labels: labels,

            datasets: [{
                label: "Average Recorded Speed",
                data: speedValues,
                borderWidth: 3,
                tension: 0.3,
                fill: false,
                spanGaps: true
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
                    beginAtZero: true,

                    title: {
                        display: true,
                        text: "Speed (mph)"
                    }
                }
            }
        }
    });
}

function updateMapMetric(metric, data = zoneData) {

    if (!window.taxiZoneLayer) {
        return;
    }

    const values = [];

    window.taxiZoneLayer.eachLayer(layer => {

        const properties = layer.feature.properties || {};

        const zoneId =
            properties.LocationID ||
            properties.location_id ||
            properties.zone_id;

        const matchingZones = data.filter(zone =>
            String(zone.location_id) === String(zoneId)
        );

        let value = 0;

        if (metric === "pickups") {

            value = matchingZones.reduce(
                (total, zone) =>
                    total + Number(zone.pickup_count || 0),
                0
            );

        } else if (metric === "speed") {

            const speeds = matchingZones
                .map(zone => Number(zone.mean_trip_speed_mph))
                .filter(speed => !isNaN(speed) && speed > 0);

            value = speeds.length
                ? speeds.reduce((a, b) => a + b, 0) / speeds.length
                : 0;

        } else if (metric === "fare") {

            const fares = matchingZones
                .map(zone => Number(zone.base_fare_per_mile))
                .filter(fare => !isNaN(fare) && fare > 0);

            value = fares.length
                ? fares.reduce((a, b) => a + b, 0) / fares.length
                : 0;
        }

        values.push(value);
        layer._metricValue = value;
    });

    const maxValue = Math.max(...values, 0);

    window.taxiZoneLayer.eachLayer(layer => {

        const value = layer._metricValue || 0;

        const intensity = maxValue > 0
            ? value / maxValue
            : 0;

        layer.setStyle({
            fillColor: "#f4c430",
            fillOpacity: value > 0
                ? 0.15 + (intensity * 0.65)
                : 0.10,
            color: "#f4c430",
            weight: 1
        });
    });
}

hourFilter.addEventListener("change", loadDashboard);

metricFilter.addEventListener("change", function() {
    updateMapMetric(metricFilter.value, currentFilteredData);
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

    if (!searchTerm) {
        updateDashboard(zoneData);
        return;
    }

    const filteredData = zoneData.filter(zone =>
        (zone.zone_name || "").toLowerCase().includes(searchTerm)
    );

    updateDashboard(filteredData);

    if (window.taxiZoneLayer && filteredData.length > 0) {
        const zoneName = filteredData[0].zone_name;

        window.taxiZoneLayer.eachLayer(layer => {
            const properties = layer.feature.properties || {};
            const mapZoneName =
                properties.zone_name ||
                properties.zone ||
                "";

            if (mapZoneName.toLowerCase() === zoneName.toLowerCase()) {
                taxiMap.fitBounds(layer.getBounds(), {
                    padding: [30, 30]
                });

                layer.setStyle({
                    fillOpacity: 0.6,
                    weight: 3
                });

                setTimeout(() => {
                    layer.setStyle({
                        fillOpacity: 0.15,
                        weight: 1
                    });
                }, 1500);
            }
        });
    }
});

searchInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();

        const map = document.getElementById("map");

        if (map) {
            const mapPosition = map.getBoundingClientRect().top + window.scrollY;

            window.scrollTo({
                top: mapPosition - 100,
                behavior: "smooth"
            });
        }
    }
}); 

sortFilter.addEventListener("change", function() {
    updateRanking(zoneData);
});

loadDashboard();