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

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK') {
            const distance = data.rows[0].elements[0].distance.value / 1000;
            res.status(200).json({ distance });
        } else {
            res.status(400).json({ error: 'Could not calculate distance' });
        }
    } catch (error) {
        console.error('Distance error:', error);
        res.status(500).json({ error: 'Distance calculation failed', details: error.message });
    }
}
