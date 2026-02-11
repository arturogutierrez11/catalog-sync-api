import {
  SyncStateAction,
  SyncStateParams,
} from 'src/core/drivers/madre-api/syncStates/SyncStatesRepository';

export interface ISyncStatesRepository {
  postState(action: SyncStateAction, body: SyncStateParams): Promise<void>;
  getState(params: { process_name: string; seller_id: string }): Promise<any>;
}
