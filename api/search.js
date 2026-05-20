export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Use Google Places Text Search API — returns multiple matching places
        // for partial-text queries (the Geocoding API only returns full address matches).
        // Bias results to Aruba: center ~12.5211, -69.9683, radius 20km covers the island.
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json` +
            `?query=${encodeURIComponent(query)}` +
            `&location=12.5211,-69.9683` +
            `&radius=20000` +
            `&region=aw` +
            `&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            const results = data.results
                .filter(r => r.geometry && r.geometry.location)
                .map(result => ({
                    formatted_address: result.name
                        ? `${result.name}, ${result.formatted_address || ''}`.replace(/,\s*$/, '')
                        : result.formatted_address,
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng
                }));
            res.status(200).json(results);
        } else if (data.status === 'ZERO_RESULTS') {
            res.status(200).json([]);
        } else {
            console.error('Places API error:', data.status, data.error_message);
            res.status(500).json({
                error: 'Places API error',
                status: data.status,
                message: data.error_message || null
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed', details: error.message });
    }
}
