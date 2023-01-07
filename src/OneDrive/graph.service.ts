// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Injectable } from '@angular/core';
import * as MicrosoftGraph from '@microsoft/microsoft-graph-types';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class GraphService {
  constructor(
    private authService: AuthService,
  ) { }

  // https://learn.microsoft.com/en-us/graph/api/resources/onedrive?view=graph-rest-1.0

  async getFolderItems(
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
        .select('id,name,folder,lastModifiedDateTime')
        .get();

      return result.value;
    } catch (error) {
      console.error('Could not get folder items', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  async createFolder(
    name: string,
    parentid: string,
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
      const result = await this.authService.graphClient
        .api(`/me/drive/items/${parentid}/children`)
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

  async createFile(
    parentid: string, // parent folder
    name: string,
    content: string,
  ): Promise<MicrosoftGraph.DriveItem | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      const result = await this.authService.graphClient
        .api(`/me/drive/items/${parentid}:/${name}:/content?@microsoft.graph.conflictBehavior=rename`)
        .put(content)

      return result;
    } catch (error) {
      console.error('Could not save new file', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  async updateFile(
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

  async renameItem(
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
