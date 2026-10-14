const API_BASE_URL = "http://localhost:3000/api";

async function getZoneSummary(hour = "all") {

    if (hour === "all") {

        const requests = [];

        for (let i = 0; i < 24; i++) {
            requests.push(
                fetch(`${API_BASE_URL}/zones/summary?pickup_hour=${i}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Unable to load data for hour ${i}`);
                        }

                        return response.json();
                    })
                    .then(data => {
                        return data.zones.map(zone => ({
                            ...zone,
                            pickup_hour: i
                        }));
                    })
            );
        }

        const results = await Promise.all(requests);

        return {
            zones: results.flat()
        };
    }

    const response = await fetch(
        `${API_BASE_URL}/zones/summary?pickup_hour=${hour}`
    );

    if (!response.ok) {
        throw new Error("Unable to load zone data");
    }

    const data = await response.json();

    return {
        ...data, // NG - copy response's existing properties
        zones: data.zones.map(zone => ({
            ...zone,
            pickup_hour: Number(hour)
        }))
    };
}