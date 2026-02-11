import { AxiosRequestConfig } from 'axios';

export interface IMadreHttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T>;
}
