import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from '../home/home.component';
import { OneDriveComponent } from '../OneDrive/onedrive.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'onedrive', component: OneDriveComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
