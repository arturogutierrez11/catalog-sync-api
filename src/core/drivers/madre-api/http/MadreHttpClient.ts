import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Injectable } from '@nestjs/common';
import { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { MadreHttpErrorHandler } from './error/MadreHttpError';
import { getMadreConfig } from '../Config/MadreConfig';

@Injectable()
export class MadreHttpClient implements IMadreHttpClient {
  private readonly client: AxiosInstance;

  constructor() {
    const config = getMadreConfig();

    if (!config.api.baseUrl) {
      throw new Error('MADRE_API_BASE_URL is not defined');
    }

    if (!config.api.internalApiKey) {
      throw new Error('MADRE_INTERNAL_API_KEY is not defined');
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
      return MadreHttpErrorHandler.handle(error);
    }
  }

  async post<T>(
    url: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(url, body, config);
      return response.data;
    } catch (error) {
      throw MadreHttpErrorHandler.handle(error);
    }
  }

  async put<T>(
    url: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.put<T>(url, body, config);
      return response.data;
    } catch (error) {
      return MadreHttpErrorHandler.handle(error);
    }
  }

  async patch<T>(
    url: string,
    body: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response = await this.client.patch<T>(url, body, config);
      return response.data;
    } catch (error) {
      throw MadreHttpErrorHandler.handle(error);
    }
  }
}
