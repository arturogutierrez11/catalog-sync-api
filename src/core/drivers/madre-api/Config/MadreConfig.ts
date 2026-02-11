export const getMadreConfig = () => ({
  api: {
    baseUrl: process.env.MADRE_API_BASE_URL,
    timeout: Number(process.env.MADRE_API_TIMEOUT ?? 30000),
    internalApiKey: process.env.MADRE_INTERNAL_API_KEY,
  },
});
