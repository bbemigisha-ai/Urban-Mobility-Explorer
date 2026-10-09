working notes:

1. Condition checked: Recorded trip duration exceeds 180 minutes (three hours).
2. Matching records: 20,913.
3. Reason for review: Many durations cluster near 24 hours, and inspected examples pair those durations with relatively short distances. These combinations raise concerns about timestamp reliability and could distort duration or speed analysis. The cause is unconfirmed; the threshold flags records for review rather than automatic exclusion.
4. Original values: Pickup times, drop-off times, distances, and fares remain unchanged. The flag_long_duration_review column identifies these records without correcting or deleting them.

eligibility counts are consistent:

- 7,583,141 trips qualify for the provisional speed analysis.
- 7,411,905 also have shapes for both endpoints.
- 84,651 fail the speed-analysis conditions.
- 171,236 qualify for speed analysis but lack at least one endpoint shape.
