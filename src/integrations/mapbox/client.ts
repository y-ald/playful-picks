import axios from 'axios';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

if (!MAPBOX_ACCESS_TOKEN) {
  console.warn("Missing VITE_MAPBOX_ACCESS_TOKEN environment variable.");
}

export const mapboxClient = {
  forward: async (query: string, language: string, country: string) => {
    const response = await axios.get('https://api.mapbox.com/search/searchbox/v1/forward', {
      params: {
        q: query,
        language: language,
        country: country,
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
