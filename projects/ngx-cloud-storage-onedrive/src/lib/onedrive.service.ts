import { Injectable } from '@angular/core';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { AuthService } from './auth.service';

import { ConflictBehavior, FileData, Ng3FileList } from 'ngx-cloud-storage-types';

@Injectable()
export class OneDriveService implements Ng3FileList {
  constructor(
    private authService: AuthService,
  ) { }


  public async getFolderItems(itemid: string | undefined): Promise<FileData[]> {
    const driveitems: Array<FileData> = [];

    await this._getFolderItems(itemid).then(data => {
      if (!data) return;

      data.forEach(item => {
        if (!item.name?.startsWith('.'))
          driveitems.push(this.addDriveItem(item));
      });

    });

    return driveitems;
  }

  public async createFolder(foldername: string, folderid: string | undefined): Promise<FileData | undefined> {
    let result: FileData | undefined = undefined;

    await this._createFolder(foldername, folderid).then(data => {
      if (!data) { result = undefined; return }

      result = this.addDriveItem(data);
    });

    return result;
  }

  public async createFile(folderid: string | undefined, filename: string, content: string): Promise<FileData | undefined> {
    let result: FileData | undefined = undefined;

    await this._createFile(folderid, filename, content).then(data => {
      if (!data) { result = undefined; return }

      result = this.addDriveItem(data);
    });

    return result;
  }

  public async updateFile(itemid: string, content: string): Promise<FileData | undefined> {
    let result: FileData | undefined = undefined;

    await this._updateFile(itemid, content).then(data => {
      if (!data) { result = undefined; return }

      result = this.addDriveItem(data);
    });

    return result;
  }

  public async renameItem(itemid: string, newname: string): Promise<FileData | undefined> {
    let result: FileData | undefined = undefined;

    await this._renameItem(itemid, newname).then(data => {
      if (!data) { result = undefined; return }

      result = this.addDriveItem(data);
    });

    return result;
  }



  // https://learn.microsoft.com/en-us/graph/api/resources/onedrive?view=graph-rest-1.0

  private getFileExtension(name: string) {
    const re: RegExp = /(?:\.([^.]+))?$/;
    const result = re.exec(name);
    if (!result) return '';

    const fileExtension = result[1] || '';
    return fileExtension;
  }

  private sizes: Array<string> = ['bytes', 'KB', 'MB', 'GB', 'TB']

  private fileSize(size: number): string {
    let index = 0;
    while (size > 1024) {
      index++;
      size /= 1024;
    }
    return `${size.toFixed(1).replace('.0', '')} ${this.sizes[index]} - `;
  }


  private addDriveItem(item: MicrosoftGraph.DriveItem): FileData {
    let extension = item.name ? this.getFileExtension(item.name) : '';
    if (item.folder) extension = 'folder';

    return <FileData>{
      isfolder: item.folder != undefined,
      name: item.name,
      id: item.id,
      extension,
      lastmodified: item.lastModifiedDateTime,
      size: item.size ? this.fileSize(item.size) : ''
    }
  }

  private async _getFolderItems(
    itemid?: string,
  ): Promise<MicrosoftGraph.DriveItem[] | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      let path = '/me/drive/root/children';
      if (itemid) path = `/me/drive/items/${itemid}/children`;

      const result = await this.authService.graphClient
        .api(path)
        .select('id,name,folder,lastModifiedDateTime,size')
        .get();

      return result.value;
    } catch (error) {
      console.error('Could not get folder items', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  private async _createFolder(
    name: string,
    parentid: string | undefined,
  ): Promise<MicrosoftGraph.DriveItem | undefined> {
    const driveItem = {
      name,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename'
    };

    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      let path = `/me/drive/root/children`
      if (parentid) path = `/me/drive/items/${parentid}/children`

      const result = await this.authService.graphClient
        .api(path)
        .post(driveItem);

      return result;
    } catch (error) {
      console.error('Could not create folder', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  async deleteItem(
    fileid: string,
  ): Promise<number | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      const result = await this.authService.graphClient
        .api(`/me/drive/items/${fileid}`)
        .delete();

      return result;
    } catch (error) {
      console.error('Could not delete item', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  async getDownloadUrl(
    itemid: string,
  ): Promise<string | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      const result = await this.authService.graphClient
        .api(`/drive/items/${itemid}?select=id,@microsoft.graph.downloadUrl`)
        .get();

      return result['@microsoft.graph.downloadUrl'];
    } catch (error) {
      console.error('Could not get download URL', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  private async _createFile(
    parentid: string | undefined, // parent folder
    name: string,
    content: string,
    conflictBehavior: ConflictBehavior = 'replace'
  ): Promise<MicrosoftGraph.DriveItem | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      let id = parentid
      if (!id) id = 'root';

      const result = await this.authService.graphClient
        .api(`/me/drive/items/${id}:/${name}:/content?@microsoft.graph.conflictBehavior=${conflictBehavior}`)
        .put(content)

      return result;
    } catch (error) {
      console.error('Could not save new file', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  private async _updateFile(
    itemid: string,
    content: string,
  ): Promise<MicrosoftGraph.DriveItem | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      const result = await this.authService.graphClient
        .api(`/me/drive/items/${itemid}/content`)
        .put(content)

      return result;
    } catch (error) {
      console.error('Could not save new file', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  async duplicateFile(
    itemid: string,
    dupname: string,
  ): Promise<undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    return this.authService.graphClient
      .api(`/me/drive/items/${itemid}/copy`)
      .post({ name: dupname });
  }

  private async _renameItem(
    itemid: string,
    newname: string,
  ): Promise<MicrosoftGraph.DriveItem | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      const result = await this.authService.graphClient
        .api(`/me/drive/items/${itemid}`)
        .update({ name: newname })

      return result;
    } catch (error) {
      console.error('Could not rename item', JSON.stringify(error, null, 2));
    }
    return undefined;
  }


}
