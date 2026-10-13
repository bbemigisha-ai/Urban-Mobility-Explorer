const taxiMap = L.map("map").setView([40.7128, -74.0060], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
}).addTo(taxiMap);

let mapzoneData = [];
let selectedZone = null;

function updateMapData(data) {
    mapzoneData = data;

    updateMapMetric(metricFilter.value);

    // receive the array supplied by caller, assign it to mapzoneData. 

    if (selectedZone) {
        displaySelectedZone(
            selectedZone.zoneId, 
            selectedZone.zoneName, 
            selectedZone.borough
        );
    }
}

function displaySelectedZone(zoneId, zoneName, borough) {
    const zoneDetails =
            document.getElementById("zoneDetails");

        const matchingZones = mapzoneData.filter(zone => {

            return String(zone.location_id) === String(zoneId);
        });

        const pickupCount = matchingZones.reduce(
            (total, zone) =>
                total + Number(zone.pickup_count || 0),
            0
        );

       const averageSpeed = calculateMeanSpeed(matchingZones);

        zoneDetails.innerHTML = `
            <h2>${zoneName}</h2>
            <p>${borough}</p>

            <div class="zone-stat">
                <span>Pickups</span>
                <strong>${pickupCount.toLocaleString()}</strong>
            </div>

            <div class="zone-stat">
                <span>Average Speed</span>
                <strong>${averageSpeed === null ? "-" : `${averageSpeed.toFixed(1)} mph`}</strong>
            </div>
        `;
}


fetch("assets/taxi_zones.geojson")
    .then(response => response.json())
    .then(data => {

        console.log("GeoJSON loaded:", data);

        const validFeatures = data.features.filter(feature => {
            return feature &&
                   feature.type === "Feature" &&
                   feature.geometry &&
                   feature.geometry.type &&
                   feature.geometry.coordinates;
        });

        console.log("Valid features:", validFeatures.length);

        window.taxiZoneLayer = L.geoJSON({
            type: "FeatureCollection",
            features: validFeatures
        }, {

            style: {
                color: "#f4c430",
                weight: 1,
                fillColor: "#f4c430",
                fillOpacity: 0.15
            },

            onEachFeature: function(feature, layer) {

                const properties = feature.properties || {};

                const zoneName =
                    properties.zone_name ||
                    properties.zone ||
                    "Unknown Zone";

                const borough =
                    properties.borough ||
                    "Unknown Borough";

                const zoneId =
                    properties.LocationID ||
                    properties.location_id ||
                    properties.zone_id;

                layer.bindTooltip(zoneName);

                layer.on("click", function() {

                    console.log("Selected zone:", zoneName);
                    console.log("Zone ID:", zoneId);

                    selectedZone = {zoneId, zoneName, borough};
                    displaySelectedZone(zoneId, zoneName, borough);
                });

                    
                layer.on("mouseover", function() {
                    layer.setStyle({
                        weight: 2
                    });
                });

                layer.on("mouseout", function() {
                    layer.setStyle({
                        weight: 1
                    });
                });
            }

        }).addTo(taxiMap);

        updateMapMetric(metricFilter.value);
    })
    .catch(error => {
        console.error("Could not load taxi zones:", error);
    });