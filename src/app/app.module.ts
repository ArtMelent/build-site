import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LandingComponent } from './landing/landing.component';
import { MaterialModule } from './material/material.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UnderRoadComponent } from './our-services/under-road/under-road.component';
import { UnderRailwayComponent } from './our-services/under-railway/under-railway.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactsComponent } from './contacts/contacts.component';
import { LayingWaterComponent } from './our-services/laying-water/laying-water.component';
import { LayingGnbComponent } from './our-services/laying-gnb/laying-gnb.component';
import { LayingSewerageComponent } from './our-services/laying-sewerage/laying-sewerage.component';
import { PipeAdhesionComponent } from './our-services/pipe-adhesion/pipe-adhesion.component';
import { TrenchDiggerComponent } from './our-services/trench-digger/trench-digger.component';
import { FindingNetworksComponent } from './our-services/finding-networks/finding-networks.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    LandingComponent,
    UnderRoadComponent,
    UnderRailwayComponent,
    AboutUsComponent,
    ContactsComponent,
    LayingWaterComponent,
    LayingGnbComponent,
    LayingSewerageComponent,
    PipeAdhesionComponent,
    TrenchDiggerComponent,
    FindingNetworksComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    BrowserAnimationsModule,
    
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
