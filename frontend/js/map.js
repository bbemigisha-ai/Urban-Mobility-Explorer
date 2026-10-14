const taxiMap = L.map("map").setView([40.7128, -74.0060], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
}).addTo(taxiMap);

let mapzoneData = [];
getZoneSummary("all")
    .then(data => {   
        mapzoneData = data.zones;

        console.log("Map zone data:", mapzoneData);
    })
    .catch(error => {
        console.error("Could not load zone data for map:", error);
    });


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

                    const speeds = matchingZones
                        .map(zone => Number(zone.mean_trip_speed_mph))
                        .filter(speed => !isNaN(speed) && speed > 0);

                    const averageSpeed = speeds.length
                        ? speeds.reduce((a, b) => a + b, 0) / speeds.length
                        : 0;

                    zoneDetails.innerHTML = `
                        <h2>${zoneName}</h2>
                        <p>${borough}</p>

                        <div class="zone-stat">
                            <span>Pickups</span>
                            <strong>${pickupCount.toLocaleString()}</strong>
                        </div>

                        <div class="zone-stat">
                            <span>Average Speed</span>
                            <strong>${averageSpeed.toFixed(1)} mph</strong>
                        </div>
                    `;
                });

                layer.on("mouseover", function() {
                    layer.setStyle({
                        fillOpacity: 0.4,
                        weight: 2
                    });
                });

                layer.on("mouseout", function() {
                    layer.setStyle({
                        fillOpacity: 0.15,
                        weight: 1
                    });
                });
            }

        }).addTo(taxiMap);
    })
    .catch(error => {
        console.error("Could not load taxi zones:", error);
    });