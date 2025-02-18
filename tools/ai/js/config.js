const config = {
    apiKey: process.env.GOOGLE_API_KEY || '',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision',
    maxTokens: 1024,
    temperature: 0.7
};

if (!config.apiKey) {
    console.warn('API key not found in environment variables');
}

export default config;
