import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { BrowserCacheLocation, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalModule, MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { MomentModule } from 'ngx-moment';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';

import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HomeComponent } from '../home/home.component';
import { OneDriveComponent } from '../OneDrive/onedrive.component';

import { WebFileListComponent } from '../web-file-list/web-file-list.component';
import { Ng3FileListComponent } from '../three/ng3-file-list/ng3-file-list.component';

import { NgtCanvasModule } from '@angular-three/core';
import { NgtColorAttributeModule } from '@angular-three/core/attributes';
import { NgtPointLightModule } from '@angular-three/core/lights';
import { NgtMeshModule } from '@angular-three/core/meshes';
import { NgtBoxGeometryModule, NgtCylinderGeometryModule } from '@angular-three/core/geometries';
import { NgtMeshBasicMaterialModule } from '@angular-three/core/materials';
import { ThreeSceneComponent } from '../three/scene/scene.component';
import { Ng3FlatUiModule } from 'ng3-flat-ui';
import { NgtGroupModule } from '@angular-three/core/group';
import { NgtSobaOrbitControlsModule } from '@angular-three/soba/controls'
import { Ng3WebxrModule } from 'ng3-webxr';
import { OAuthSettings } from '../OneDrive/oauth';


let msalInstance: IPublicClientApplication | undefined = undefined;

export function MSALInstanceFactory(): IPublicClientApplication {
  msalInstance =
    msalInstance ??
    new PublicClientApplication({
      auth: {
        clientId: OAuthSettings.appId,
        redirectUri: OAuthSettings.redirectUri,
        postLogoutRedirectUri: OAuthSettings.redirectUri,
      },
      cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage,
      },
    });

  return msalInstance;
}
@NgModule({
  declarations: [
    AppComponent,

    HomeComponent,
    OneDriveComponent,
    WebFileListComponent,

    ThreeSceneComponent,
    Ng3FileListComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MsalModule,
    HttpClientModule,
    MomentModule,
    FlexLayoutModule,

    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatTooltipModule,
    MatSelectModule,

    NgtCanvasModule,
    NgtColorAttributeModule,
    NgtPointLightModule,
    NgtMeshModule,
    NgtGroupModule,
    NgtBoxGeometryModule,
    NgtCylinderGeometryModule,
    NgtMeshBasicMaterialModule,

    NgtSobaOrbitControlsModule,

    Ng3FlatUiModule,
    Ng3WebxrModule,
  ],
  providers: [
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    MsalService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
