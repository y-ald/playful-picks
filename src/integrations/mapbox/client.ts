import axios from 'axios';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoieWFsZCIsImEiOiJjbTd2bDJ4eTkwMHk4MmtyMWw0ODFqN3JuIn0.qGvFfHpYvGkrY0w4KPK9eQ'; // Replace with your Mapbox access token

export const mapboxClient = {
  forward: async (query: string, language: string, country: string) => {
    const response = await axios.get('https://api.mapbox.com/search/searchbox/v1/forward', {
      params: {
        q: query,
        language: language,
        country: country,
        limit: 5,
        access_token: MAPBOX_ACCESS_TOKEN,
      },
    });
    return response.data.features;
  },
  retrieve: async (featureId: string) => {
    const response = await axios.get(`https://api.mapbox.com/search/searchbox/v1/retrieve/${featureId}`, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
      },
    });
    console.log(response.data);
    return response.data.features[0];
  },
};
