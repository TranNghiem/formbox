import { Injectable } from '@angular/core';
import { Logger } from '@nsalaun/ng-logger';

/**
 * Service für die Interaktion mit MS Office.
 */
@Injectable()
export class OfficeService {
  constructor(private log: Logger) { }

  /**
   * Öffnet ein Dokument in MS Office.
   * 
   * @param base64 Das Dokument als Base64-String
   */
  async openDocument(base64: string): Promise<void> {
    await Word.run(context => {
      const body = context.document.body;
      body.insertFileFromBase64(base64, 'Replace');

      return context.sync();
    });
  }

  /**
   * Liefert eine Liste der Namen aller Fragmente im aktiven Dokument.
   */
  async getDocumentCommands(): Promise<{ id: number, tag: string, cmd: string }[]> {
    return this.getAllContentControls().then(c => {
      return c.items.filter(it => it.title && it.title.startsWith('='))
        .map(it => ({ id: it.id, tag: it.tag, cmd: it.title.substr(1).trim() }));
    });
  }

  /**
   * Liefert das nächste DocumentCommand zurück.
   */
  async getNextDocumentCommand(): Promise<{ id: number, cmd: string }> {
    return this.getDocumentCommands().then(c => {
      if (c && c.length > 0) {
        const sorted = c.sort((cc1, cc2) => {
          let p1 = Number.MAX_SAFE_INTEGER;
          let p2 = Number.MAX_SAFE_INTEGER;

          if (cc1.tag && !isNaN(+cc1.tag)) {
            p1 = +cc1.tag;
          }

          if (cc2.tag && !isNaN(+cc2.tag)) {
            p2 = +cc2.tag;
          }

          if (p1 < p2) {
            return 1;
          }

          if (p1 > p2) {
            return -1;
          }

          return 0;
        });

        const cc = c.pop();

        return this.deleteContentControlTitle(cc.id).then(() => {
          return cc;
        });
      } else {
        return undefined;
      }
    });
  }

  /**
   * Fügt ein Fragment in das aktive Dokument ein.
   * 
   * @param name Name des Fragments
   * @param base64 Fragmentdatei als Base64-String
   */
  async insertFragment(id: number, base64: string): Promise<void> {
    await Word.run(context => {
      const doc = context.document;
      const control = doc.contentControls.getById(id);

      return context.sync().then(() => {
        if (base64) {
          control.insertFileFromBase64(base64, 'Replace');
        }
        control.delete(true);

        return context.sync();
      });
    }).catch(error => {
      this.log.error(error);

      return Promise.reject(error);
    });
  }

  /**
   * Ersetzt ein ContentControl durch den angegebenen Wert.
   * 
   * @param id Interne Id des ContentControls im Dokument
   * @param value
   */
  async insertValue(id: number, value: string): Promise<void> {
    await Word.run(context => {
      const doc = context.document;
      const control = doc.contentControls.getById(id);

      return context.sync().then(() => {
        if (value) {
          control.insertText(value, 'Replace');
        }
        control.delete(true);

        return context.sync();
      });
    }).catch(error => {
      this.log.error(error);

      return Promise.reject(error);
    });
  }

  /**
   * Fügt ein neues ContentControl an der aktuellen Cursorpsoition ein.
   * Ist ein Text im Dokument selektiert, wird das Control um den selektierten
   * Text herum angelegt. 
   * 
   * @param title
   * @param tag
   */
  async insertContentControl(title: string, tag: string): Promise<number> {
    return Word.run(context => {
      const doc = context.document;
      const range = doc.getSelection();
      const cc = range.insertContentControl();
      cc.title = title;
      cc.tag = tag;
      context.load(cc, 'id');

      return context.sync().then(() => cc.id);
    });
  }

  /**
   * Ändert Titel und Tag des angegebenen ContentControls.
   * 
   * @param id Interne Id des Controls im Dokument.
   * @param title
   * @param tag
   */
  async updateContentControl(id: number, title: string, tag: string): Promise<void> {
    await Word.run(context => {
      const doc = context.document;
      const cc = doc.contentControls.getById(id);
      cc.title = title;
      cc.tag = tag;

      return context.sync();
    });
  }

  /**
   * Löscht ein ContentControl. Der Text, den das Control umfaßt, bleibt
   * erhalten.
   * 
   * @param id
   */
  async deleteContentControl(id: number): Promise<void> {
    await Word.run(context => {
      const doc = context.document;
      const cc = doc.contentControls.getById(id);
      cc.delete(true);

      return context.sync();
    });
  }

  private deleteContentControlTitle = async (id: number): Promise<void> => {
    await Word.run(context => {
      const doc = context.document;
      const cc = doc.contentControls.getById(id);
      cc.title = '';

      return context.sync();
    });
  }

  /**
   * Gibt eine Liste aller ContentControls im aktiven Dokument zurück.
   */
  private getAllContentControls = async (): Promise<Word.ContentControlCollection> => {
    return Word.run(context => {
      const doc = context.document;
      const controls = doc.contentControls;
      controls.load('items');

      return context.sync(controls);
    });
  }
}
