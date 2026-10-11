const taxiMap = L.map("map").setView([40.7128, -74.0060], 11)

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
}).addTo(taxiMap);

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

        const taxiZoneLayer = L.geoJSON({
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
                 const zoneName = feature.properties.zone_name || "Unknown Zone";
                 
                 layer.bindTooltip(zoneName);
                 
                 layer.on("click", function() {
                    console.log("Selected zone:", zoneName);
                    
                    const zoneDetails = document.getElementById("zoneDetails");
                    
                    zoneDetails.innerHTML = `
                    <h2>${zoneName}</h2>
                    <p>Taxi Activity for this zone will appear here.</p>
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