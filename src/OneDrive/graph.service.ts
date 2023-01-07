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

  async getRootDrive(
  ): Promise<MicrosoftGraph.Drive | undefined> {
    if (!this.authService.graphClient) {
      console.error('Graph client is not initialized.');
      return undefined;
    }

    try {
      const result: MicrosoftGraph.Drive = await this.authService.graphClient
        .api('/me/drive')
        .get();

      return result;
    } catch (error) {
      console.error('Could not get drive items', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  async getDriveItem(
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
        .get();

      return result.value;
    } catch (error) {
      console.error('Could not get drive items', JSON.stringify(error, null, 2));
    }
    return undefined;
  }

  //  async addEventToCalendar(newEvent: MicrosoftGraph.Event): Promise<void> {
  //    if (!this.authService.graphClient) {
  //      console.error('Graph client is not initialized.');
  //      return undefined;
  //    }

  //    try {
  //      // POST /me/events
  //      await this.authService.graphClient.api('/me/events').post(newEvent);
  //    } catch (error) {
  //      throw Error(JSON.stringify(error, null, 2));
  //    }
  //  }
}
