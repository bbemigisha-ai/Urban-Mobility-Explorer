//insertion sort algorithm
// receive zone objects and return them ranked by pickup count

export function rankZonesByPickups(zones){
    const ranked = [...zones]; //[...zones] creates a new array that contains the same zone objects.

    for (let i = 1; i < ranked.length; i++){
        const currentZone = ranked[i];
        let j = i - 1;

        while (
            j >= 0 &&
            ranked[j].pickup_count < currentZone.pickup_count
        ) {
            ranked[j + 1] = ranked[j]; //copy from [0] to [1]
            j--; // same as j = -1; move checking position to -1
        }
        ranked[j + 1 ] = currentZone
    }

    return ranked
}

