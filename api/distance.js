export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { origin, destination } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Use Directions API with alternatives=true so we can pick the SHORTEST route.
        // The Distance Matrix API doesn't expose alternatives and can return a longer
        // route than what Google Maps shows by default.
        const url = `https://maps.googleapis.com/maps/api/directions/json` +
            `?origin=${origin.lat},${origin.lng}` +
            `&destination=${destination.lat},${destination.lng}` +
            `&mode=driving` +
            `&alternatives=true` +
            `&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
            // Each route may have multiple legs; sum them. Pick the route with the
            // smallest total distance (most direct), matching what a taxi would drive.
            const routeDistancesMeters = data.routes.map(route =>
                route.legs.reduce((sum, leg) => sum + (leg.distance ? leg.distance.value : 0), 0)
            );
            const shortestMeters = Math.min(...routeDistancesMeters);
            const distance = shortestMeters / 1000;

            console.log('Directions API routes (km):', routeDistancesMeters.map(m => (m / 1000).toFixed(2)),
                'picked shortest:', distance.toFixed(2));

            res.status(200).json({
                distance,
                allRoutesKm: routeDistancesMeters.map(m => +(m / 1000).toFixed(2))
            });
        } else {
            console.error('Directions API error:', data.status, data.error_message);
            res.status(500).json({
                error: 'Directions API error',
                status: data.status,
                message: data.error_message || null
            });
        }
    } catch (error) {
        console.error('Distance error:', error);
        res.status(500).json({ error: 'Distance calculation failed', details: error.message });
    }
}
