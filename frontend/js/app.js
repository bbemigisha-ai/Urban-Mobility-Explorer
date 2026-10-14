let zoneData = [];
let latestRequestId = 0;
let dashboardState = "loading";
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
    const requestId = ++latestRequestId;
    const selectedHour = hourFilter.value;
    const status = document.getElementById("dashboardStatus");

    dashboardState = "loading";
    status.textContent = "Loading taxi data . . .";

    zoneData = [];
    updateDashboard(zoneData);

    try {
        const data = await getZoneSummary(selectedHour);

        if (requestId !== latestRequestId) {
            return;
        }

        zoneData = data.zones;
        dashboardState = "ready";
        updateDashboard(zoneData);
    } catch (error) {
        if (requestId !== latestRequestId) {
            return;
        }

        dashboardState = "error";
        zoneData = [];
        updateDashboard(zoneData);

        status.textContent =
            "Could not load taxi data. Might want to check the backend, then use Reset to retry.";

        console.error("Dashboard loading error:", error);
    }
}

function updateDashboard(data) {
    const selectedBorough = boroughFilter.value;

    let filteredData = data;

    if (selectedBorough !== "all") {
        filteredData = data.filter(
            zone => zone.borough === selectedBorough
        );
    }

    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm) {
        filteredData = filteredData.filter(zone =>
            (zone.zone_name || "").toLowerCase().includes(searchTerm)
        );
    }

    if (dashboardState === "ready") {
        document.getElementById("dashboardStatus").textContent =
            filteredData.length
                ? ""
                : "No zones match your filters";
    }

    updateMapData(filteredData);
    updateKPIs(filteredData);
    updateRanking(filteredData);
    updateHourlyChart(filteredData);
    updateInsights(filteredData);
    updateBoroughChart(filteredData);
    updateSpeedChart(filteredData);
    updateMapMetric(metricFilter.value);
}

function updateInsights(data) {
    const busiestHours = document.getElementById("busiestHours");

    if (!data.length) {
        const message =
            dashboardState === "loading"
                ? "Loading data..."
                : dashboardState === "error"
                    ? "Data unavailable."
                    : "No matching zones.";

        for (const id of [
            "busiestHours",
            "busiestBorough",
            "speedInsight",
            "fareInsight"
        ]) {
            document.getElementById(id).textContent = message;
        }

        return;
    }

    const hourlyTotals = {};

    data.forEach(zone => {
        const hour = Number(zone.pickup_hour);
        const pickups = Number(zone.pickup_count || 0);

        if (!isNaN(hour)) {
            hourlyTotals[hour] =
                (hourlyTotals[hour] || 0) + pickups;
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

    const hourPickups = Number(busiestHour[1]);

    if (hourPickups === 0) {
        busiestHours.textContent =
            "No pickups recorded for the current filters";
    } else {
        const prefix =
            hourFilter.value === "all"
                ? "Busiest hour"
                : "Selected hour";

        busiestHours.textContent =
            `${prefix}: ${formattedHour} with ${hourPickups.toLocaleString()} pickups`;
    }

    const busiestBorough =
        document.getElementById("busiestBorough");

    const boroughTotals = {};

    data.forEach(zone => {
        const borough = zone.borough || "Unknown";
        const pickups = Number(zone.pickup_count || 0);

        boroughTotals[borough] =
            (boroughTotals[borough] || 0) + pickups;
    });

    const topBorough = Object.entries(boroughTotals)
        .sort((a, b) => b[1] - a[1])[0];

    if (topBorough && Number(topBorough[1]) > 0) {
        busiestBorough.textContent =
            `${topBorough[0]} with ${Number(topBorough[1]).toLocaleString()} pickups`;
    } else {
        busiestBorough.textContent =
            "No pickups recorded for the current filters";
    }

    const speedInsight =
        document.getElementById("speedInsight");

    const averageSpeed = calculateMeanSpeed(data);

    speedInsight.textContent =
        averageSpeed === null
            ? "No speed data available"
            : `Average recorded speed is ${averageSpeed.toFixed(1)} mph`;

    const fareInsight =
        document.getElementById("fareInsight");

    const averageFare = calculateMeanFare(data);

    fareInsight.textContent =
        averageFare === null
            ? "No fare data available"
            : `Average base fare per trip is $${averageFare.toFixed(2)}`;
}

function calculateMeanSpeed(data) {
    let weightedSpeedTotal = 0;
    let eligibleTripTotal = 0;

    for (const zone of data) {
        const speed = zone.mean_trip_speed_mph;
        const count = Number(zone.eligible_speed_count);

        if (
            speed !== null &&
            Number.isFinite(Number(speed)) &&
            count > 0
        ) {
            weightedSpeedTotal += Number(speed) * count;
            eligibleTripTotal += count;
        }
    }

    if (eligibleTripTotal > 0) {
        return weightedSpeedTotal / eligibleTripTotal;
    }

    return null;
}

function calculateMeanFare(data) {
    let weightedFareTotal = 0;
    let eligibleFareTotal = 0;

    for (const zone of data) {
        const fare = zone.mean_base_fare;
        const count = Number(zone.eligible_fare_count);

        if (
            fare !== null &&
            Number.isFinite(Number(fare)) &&
            count > 0
        ) {
            weightedFareTotal += Number(fare) * count;
            eligibleFareTotal += count;
        }
    }

    if (eligibleFareTotal > 0) {
        return weightedFareTotal / eligibleFareTotal;
    }

    return null;
}

function calculateMeanDistance(data) {
    let weightedDistanceTotal = 0;
    let eligibleDistanceTotal = 0;

    for (const zone of data) {
        const distance = zone.mean_trip_distance;
        const count = Number(zone.eligible_distance_count);

        if (
            distance !== null &&
            Number.isFinite(Number(distance)) &&
            count > 0
        ) {
            weightedDistanceTotal += Number(distance) * count;
            eligibleDistanceTotal += count;
        }
    }

    if (eligibleDistanceTotal > 0) {
        return weightedDistanceTotal / eligibleDistanceTotal;
    }

    return null;
}

function updateKPIs(data) {
    if (!data.length) {
        for (const id of [
            "totalPickups",
            "averageSpeed",
            "averageDistance",
            "averageFare"
        ]) {
            document.getElementById(id).textContent = "-";
        }

        return;
    }

    const totalPickups = data.reduce(
        (total, zone) =>
            total + Number(zone.pickup_count || 0),
        0
    );

    document.getElementById("totalPickups").textContent =
        totalPickups.toLocaleString();

    const averageSpeed = calculateMeanSpeed(data);

    document.getElementById("averageSpeed").textContent =
        averageSpeed === null
            ? "-"
            : `${averageSpeed.toFixed(1)} mph`;

    const averageDistance = calculateMeanDistance(data);

    document.getElementById("averageDistance").textContent =
        averageDistance === null
            ? "-"
            : `${averageDistance.toFixed(2)} miles`;

    const averageFare = calculateMeanFare(data);

    document.getElementById("averageFare").textContent =
        averageFare === null
            ? "-"
            : `$${averageFare.toFixed(2)}`;
}

function aggregateZones(data) {
    const zonesById = new Map();

    for (const zone of data) {
        const zoneId = zone.location_id;

        if (!zonesById.has(zoneId)) {
            zonesById.set(zoneId, {
                location_id: zoneId,
                zone_name: zone.zone_name,
                borough: zone.borough,
                pickup_count: 0
            });
        }

        const combinedZone = zonesById.get(zoneId);

        combinedZone.pickup_count +=
            Number(zone.pickup_count || 0);
    }

    return Array.from(zonesById.values());
}

function updateRanking(data) {
    const rankingContainer =
        document.getElementById("zoneRanking");

    const sortDirection = sortFilter.value;
    const highestFirst = sortDirection === "desc";

    document.getElementById("rankingTitle").textContent =
        highestFirst
            ? "Top 5 Taxi Zones"
            : "Lowest 5 Taxi Zones";

    document.getElementById("rankingDescription").textContent =
        highestFirst
            ? "Matching zones with the most pickups"
            : "Matching zones with the fewest pickups";

    if (!data.length) {
        rankingContainer.textContent =
            dashboardState === "loading"
                ? "Loading zones. . ."
                : dashboardState === "error"
                    ? "Zone data unavailable"
                    : "No matching zones";

        return;
    }

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
            <strong>${Number(
                zone.pickup_count || 0
            ).toLocaleString()}</strong>
        `;

        rankingContainer.appendChild(item);
    });
}

function updateHourlyChart(data) {
    const hourlyTotals = Array(24).fill(0);

    data.forEach(zone => {
        const hour = Number(zone.pickup_hour);

        if (hour >= 0 && hour <= 23) {
            hourlyTotals[hour] +=
                Number(zone.pickup_count || 0);
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

    const allHours = hourFilter.value === "all";
    const selectedHour = Number(hourFilter.value);

    const chartLabels = allHours
        ? labels
        : [labels[selectedHour]];

    const chartValues = !data.length
        ? chartLabels.map(() => null)
        : allHours
            ? hourlyTotals
            : [hourlyTotals[selectedHour]];

    document.getElementById("chartTitle").textContent =
        allHours
            ? "Taxi Activity Throughout the Day"
            : `Taxi Activity at ${labels[selectedHour]}`;

    document.getElementById("chartDescription").textContent =
        !data.length
            ? "No chart data to display"
            : "Pickup totals across matching zones; times are NYC local time";

    const canvas =
        document.getElementById("hourlyChart");

    if (hourlyChart) {
        hourlyChart.destroy();
    }

    hourlyChart = new Chart(canvas, {
        type: allHours ? "line" : "bar",
        data: {
            labels: chartLabels,
            datasets: [{
                label: "Taxi Pickups",
                data: chartValues,
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
    const canvas =
        document.getElementById("boroughChart");

    if (!canvas) {
        return;
    }

    const boroughTotals = {};

    data.forEach(zone => {
        const borough = zone.borough;

        if (
            !borough ||
            borough === "Unknown" ||
            borough === "EWR"
        ) {
            return;
        }

        boroughTotals[borough] =
            (boroughTotals[borough] || 0) +
            Number(zone.pickup_count || 0);
    });

    const boroughs = [
        "Bronx",
        "Brooklyn",
        "Manhattan",
        "Queens",
        "Staten Island"
    ];

    const values = boroughs.map(
        borough => boroughTotals[borough] || 0
    );

    if (boroughChart) {
        boroughChart.destroy();
    }

    boroughChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: boroughs,
            datasets: [{
                label: "Taxi Pickups",
                data: values,
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
    const canvas =
        document.getElementById("speedChart");

    if (!canvas) {
        return;
    }

    const hourlySpeedTotals = Array(24).fill(0);
    const hourlyEligibleTotals = Array(24).fill(0);

    data.forEach(zone => {
        const hour = Number(zone.pickup_hour);
        const speed = Number(zone.mean_trip_speed_mph);
        const count = Number(zone.eligible_speed_count);

        if (
            hour >= 0 &&
            hour <= 23 &&
            Number.isFinite(speed) &&
            count > 0
        ) {
            hourlySpeedTotals[hour] += speed * count;
            hourlyEligibleTotals[hour] += count;
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

    const values = hourlySpeedTotals.map(
        (total, hour) =>
            hourlyEligibleTotals[hour] > 0
                ? total / hourlyEligibleTotals[hour]
                : null
    );

    if (speedChart) {
        speedChart.destroy();
    }

    speedChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Average Recorded Speed (mph)",
                data: values,
                borderWidth: 3,
                tension: 0.3,
                spanGaps: true,
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
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "Miles per hour"
                    }
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

function getSpeedColor(speed) {
    if (speed === null) return "#737373";
    if (speed < 10) return "#ffffcc";
    if (speed < 15) return "#a1dab4";
    if (speed < 20) return "#41b6c4";

    return "#225ea8";
}

function getFareColor(fare) {
    if (fare === null) return "#737373";
    if (fare < 10) return "#eff3ff";
    if (fare < 15) return "#bdd7e7";
    if (fare < 20) return "#6baed6";

    return "#2171b5";
}

function updateMapLegend(metric) {
    const legend =
        document.getElementById("mapLegend");

    const legends = {
        pickups: {
            title: "Pickup count",
            items: [
                [getPickupColor(0), "0"],
                [getPickupColor(1), "1-999"],
                [getPickupColor(1000), "1,000-9,999"],
                [getPickupColor(10000), "10,000-49,999"],
                [getPickupColor(50000), "50,000+"]
            ]
        },
        speed: {
            title: "Average recorded speed (mph)",
            items: [
                [getSpeedColor(null), "No eligible speed data"],
                [getSpeedColor(0), "Below 10"],
                [getSpeedColor(10), "10 to below 15"],
                [getSpeedColor(15), "15 to below 20"],
                [getSpeedColor(20), "20+"]
            ]
        },
        fare: {
            title: "Average base fare per trip ($)",
            items: [
                [getFareColor(null), "No eligible fare data"],
                [getFareColor(0), "Below $10"],
                [getFareColor(10), "$10 to below $15"],
                [getFareColor(15), "$15 to below $20"],
                [getFareColor(20), "$20+"]
            ]
        }
    };

    const selectedLegend = legends[metric];

    legend.innerHTML = `
        <strong>${selectedLegend.title}</strong>
        <div class="legend-items">
            ${selectedLegend.items.map(
                ([color, label]) => `
                    <span class="legend-item">
                        <span
                            class="legend-swatch"
                            style="background-color: ${color};"
                            aria-hidden="true">
                        </span>
                        <span>${label}</span>
                    </span>
                `
            ).join("")}
        </div>
        <p>Faint zones are outside the current filters or lack eligible data.</p>
    `;
}

function updateMapMetric(metric) {
    updateMapLegend(metric);

    const descriptions = {
        pickups: "Pickup counts across matching taxi zones",
        speed: "Weighted average recorded speed by zone (mph)",
        fare: "Weighted average base fare per trip by zone (USD)"
    };

    document.getElementById("mapDescription").textContent =
        descriptions[metric];

    if (!window.taxiZoneLayer) {
        return;
    }

    window.taxiZoneLayer.eachLayer(layer => {
        const zone = layer.feature.properties;

        const zoneId =
            zone.LocationID ||
            zone.location_id ||
            zone.zone_id;

        const matchingZones = mapzoneData.filter(
            record =>
                String(record.location_id) === String(zoneId)
        );

        let value = 0;

        if (metric === "pickups") {
            value = matchingZones.reduce(
                (total, record) =>
                    total + Number(record.pickup_count || 0),
                0
            );
        }

        if (metric === "speed") {
            value = calculateMeanSpeed(matchingZones);
        }

        if (metric === "fare") {
            value = calculateMeanFare(matchingZones);
        }

        if (metric === "pickups") {
            layer.setStyle({
                fillColor: matchingZones.length
                    ? getPickupColor(value)
                    : "#737373",
                fillOpacity: matchingZones.length
                    ? 0.65
                    : 0.15
            });
        } else if (metric === "speed") {
            layer.setStyle({
                fillColor: getSpeedColor(value),
                fillOpacity:
                    matchingZones.length &&
                    value !== null
                        ? 0.65
                        : 0.15
            });
        } else if (metric === "fare") {
            layer.setStyle({
                fillColor: getFareColor(value),
                fillOpacity:
                    matchingZones.length &&
                    value !== null
                        ? 0.65
                        : 0.15
            });
        }
    });
}

hourFilter.addEventListener(
    "change",
    loadDashboard
);

metricFilter.addEventListener(
    "change",
    function () {
        updateMapMetric(metricFilter.value);
    }
);

boroughFilter.addEventListener(
    "change",
    function () {
        updateDashboard(zoneData);
    }
);

resetFilters.addEventListener(
    "click",
    function () {
        hourFilter.value = "all";
        boroughFilter.value = "all";
        metricFilter.value = "pickups";
        searchInput.value = "";
        sortFilter.value = "desc";

        loadDashboard();
    }
);

searchInput.addEventListener(
    "input",
    function () {
        updateDashboard(zoneData);
    }
);

searchInput.addEventListener(
    "keydown",
    function (event) {
        if (event.key !== "Enter") {
            return;
        }

        const searchTerm =
            searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            return;
        }

        const matchingZone = zoneData.find(zone =>
            (zone.zone_name || "")
                .toLowerCase()
                .includes(searchTerm)
        );

        const mapSection =
            document.getElementById("map");

        if (mapSection) {
            mapSection.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }

        if (
            matchingZone &&
            window.taxiZoneLayer
        ) {
            window.taxiZoneLayer.eachLayer(layer => {
                const properties =
                    layer.feature.properties || {};

                const zoneId =
                    properties.LocationID ||
                    properties.location_id ||
                    properties.zone_id;

                if (
                    String(zoneId) ===
                    String(matchingZone.location_id)
                ) {
                    layer.openTooltip();

                    if (
                        typeof window.taxiMap !==
                        "undefined" &&
                        window.taxiMap
                    ) {
                        window.taxiMap.fitBounds(
                            layer.getBounds(),
                            {
                                padding: [30, 30]
                            }
                        );
                    }
                }
            });
        }
    }
);

sortFilter.addEventListener(
    "change",
    function () {
        updateDashboard(zoneData);
    }
);

loadDashboard();