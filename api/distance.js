import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { origin, destination } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: `${origin.lat},${origin.lng}`,
                destinations: `${destination.lat},${destination.lng}`,
                mode: 'driving',
                key: apiKey
            }
        });

        if (response.data.status === 'OK') {
            const distance = response.data.rows[0].elements[0].distance.value / 1000;
            res.status(200).json({ distance });
        } else {
            res.status(400).json({ error: 'Could not calculate distance' });
        }
    } catch (error) {
        console.error('Distance error:', error);
        res.status(500).json({ error: 'Distance calculation failed' });
    }
}
