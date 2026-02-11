import { AxiosRequestConfig } from 'axios';

export interface IMeliHttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
