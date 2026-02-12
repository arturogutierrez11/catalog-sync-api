import { Inject, Injectable } from '@nestjs/common';
import type { IMadreHttpClient } from 'src/core/adapters/madre-api/http/IMadreHttpClient';
import { ISyncStatesRepository } from 'src/core/adapters/madre-api/syncStates/ISyncStatesRepository';

export type SyncStateParams = {
  process_name: string;
  seller_id: string;
  last_offset?: number | null;
};

export type SyncStateAction = 'start' | 'offset' | 'done' | 'failed';

@Injectable()
export class SyncStatesRepository implements ISyncStatesRepository {
  private readonly basePath = '/internal/sync-states';

  constructor(
    @Inject('IMadreHttpClient')
    private readonly httpClient: IMadreHttpClient,
  ) {}

  async getState(params: {
    process_name: string;
    seller_id: string;
  }): Promise<any> {
    return this.httpClient.get<any>(this.basePath, {
      params,
    });
  }

  async postState(
    action: SyncStateAction,
    body: SyncStateParams,
  ): Promise<void> {
    await this.httpClient.post(`${this.basePath}/${action}`, body);
  }
}
