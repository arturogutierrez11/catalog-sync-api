export const getMeliConfig = () => ({
  api: {
    baseUrl: process.env.MELI_API_BASE_URL,
    timeout: Number(process.env.MELI_API_TIMEOUT ?? 30000),
    internalApiKey: process.env.MELI_INTERNAL_API_KEY,
  },
});
