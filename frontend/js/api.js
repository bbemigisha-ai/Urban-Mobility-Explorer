const API_BASE_URL = "http://localhost:3000/api";

async function getZoneSummary(hour="all") {

    let url = '${API_BASE_URL}/zones/summary';

    if (hour !== "all") {
        url += '?pickup_hour=${hour}';
    }

    const response = await fetch(url);

    if(!response.ok){
        throw new Error("Unable to load zone data");
    }

    return await response.json();
    
}