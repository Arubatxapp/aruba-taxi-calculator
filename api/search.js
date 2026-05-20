import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req.body;
        const apiKey = process.env.GOOGLE_API_KEY;

        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                address: query + ' Aruba',
                components: 'country:AW',
                key: apiKey
            }
        });

        if (response.data.status === 'OK') {
            const results = response.data.results.map(result => ({
                formatted_address: result.formatted_address,
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng
            }));
            res.status(200).json(results);
        } else {
            res.status(200).json([]);
        }
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
}
