import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';
import { getMeliConfig } from '../Config/MeliConfig';
import { IMeliHttpClient } from 'src/core/adapters/mercadolibre-api/http/IMeliHttpClient';
import { MeliHttpErrorHandler } from './error/MeliHttpErrorHandler';

@Injectable()
export class MeliHttpClient implements IMeliHttpClient {
  private readonly client: AxiosInstance;

  constructor() {
    const config = getMeliConfig();

    if (!config.api.baseUrl) {
      throw new Error('MELI_API_BASE_URL is not defined');
    }

    if (!config.api.internalApiKey) {
      throw new Error('MELI_INTERNAL_API_KEY is not defined');
    }

    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': config.api.internalApiKey,
      },
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw MeliHttpErrorHandler.handle(error);
    }
  }
}
