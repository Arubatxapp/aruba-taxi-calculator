// Alias common terms to canonical Aruba locations. If the user's query starts with
// (or equals) one of these keys, we rewrite it before calling Google Places.
const QUERY_ALIASES = [
    { match: 'general aviation', rewrite: 'Jet TNCA FBO Aruba' },
    { match: 'private aviation', rewrite: 'Jet TNCA FBO Aruba' },
    { match: 'private terminal', rewrite: 'Jet TNCA FBO Aruba' },
    { match: 'fbo', rewrite: 'Jet TNCA FBO Aruba' },
    { match: 'tnca', rewrite: 'Jet TNCA FBO Aruba' },
    { match: 'jet aruba', rewrite: 'Jet TNCA FBO Aruba' }
];

function applyAliases(query) {
    const lower = query.toLowerCase().trim();
    for (const { match, rewrite } of QUERY_ALIASES) {
        if (lower === match || lower.startsWith(match + ' ') || lower.startsWith(match)) {
            return rewrite;
        }
    }
    return query;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query: rawQuery } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        const query = applyAliases(rawQuery);

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
