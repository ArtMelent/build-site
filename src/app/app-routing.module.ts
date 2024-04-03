import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { UnderRailwayComponent } from './our-services/under-railway/under-railway.component';
import { UnderRoadComponent } from './our-services/under-road/under-road.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactsComponent } from './contacts/contacts.component';
import { LayingWaterComponent } from './our-services/laying-water/laying-water.component';
import { LayingGnbComponent } from './our-services/laying-gnb/laying-gnb.component';
import { LayingSewerageComponent } from './our-services/laying-sewerage/laying-sewerage.component';
import { PipeAdhesionComponent } from './our-services/pipe-adhesion/pipe-adhesion.component';
import { TrenchDiggerComponent } from './our-services/trench-digger/trench-digger.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'about-gnb', component: AboutUsComponent},
  { path: 'contacts', component: ContactsComponent},

  { path: 'services/prokol-pid-dorohoiu', component: UnderRoadComponent},
  { path: 'services/prokol-pid-zaliznytseiu', component: UnderRailwayComponent},
  { path: 'services/beztransheynoyu-rokladannya-vodoprovodu', component: LayingWaterComponent},
  { path: 'services/beztransheyne-prokladannya-trub-metodom-hnb', component: LayingGnbComponent},
  { path: 'services/beztransheyne-prokladannya-kanalizatsiyi', component: LayingSewerageComponent},
  { path: 'services/spayka-trub', component: PipeAdhesionComponent},
  { path: 'services/posluhy-traysheynoho-kopacha', component: TrenchDiggerComponent},
  { path: 'services/znakhodzhennya-transheynykh-merezh', component: PipeAdhesionComponent},

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',})],
  exports: [RouterModule]
})
export class AppRoutingModule { 
  
}
