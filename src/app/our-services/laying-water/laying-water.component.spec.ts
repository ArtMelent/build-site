import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayingWaterComponent } from './laying-water.component';

describe('LayingWaterComponent', () => {
  let component: LayingWaterComponent;
  let fixture: ComponentFixture<LayingWaterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayingWaterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayingWaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
