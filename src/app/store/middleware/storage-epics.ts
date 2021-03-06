import { Injectable } from '@angular/core';
import { ActionsObservable, combineEpics } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import { Logger } from '@nsalaun/ng-logger';
import { NgRedux } from '@angular-redux/store/lib/src';

import { FormBoxState } from '../states/formbox-state';
import { StorageService } from '../../services/storage.service';
import { StorageActions } from '../actions/storage-actions';

@Injectable()
export class StorageEpics {
  constructor(
    private log: Logger,
    private db: StorageService
  ) { }

  updatingStorageSelected = (action: ActionsObservable<any>, store: NgRedux<FormBoxState>) => {
    return action.ofType(StorageActions.UPDATE_STORAGE_SELECTED.started)
      .mergeMap(({payload}, n) => {
        return this.db.setSelected(payload)
          .then(result => {
            const act = StorageActions.UPDATE_STORAGE_SELECTED.done({params: payload, result: result});

            return act;
          })
          .catch(err => {
            const act = StorageActions.UPDATE_STORAGE_SELECTED.failed({params: payload, error: err});

            return act;
          });
      });
  }

  updatingStoragePAL = (action: ActionsObservable<any>, store: NgRedux<FormBoxState>) => {
    return action.ofType(StorageActions.UPDATE_STORAGE_PAL.started)
      .mergeMap(({payload}, n) => {
        const pal = store.getState().absenderliste.pal;

        return this.db.setPAL(pal)
          .then(result => {
            const act = StorageActions.UPDATE_STORAGE_PAL.done({params: payload, result: result});

            return act;
          })
          .catch(err => {
            const act = StorageActions.UPDATE_STORAGE_PAL.failed({params: payload, error: err});

            return act;
          });
      });
  }

}
