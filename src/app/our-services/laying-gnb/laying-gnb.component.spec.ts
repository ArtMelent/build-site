import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayingGnbComponent } from './laying-gnb.component';

describe('LayingGnbComponent', () => {
  let component: LayingGnbComponent;
  let fixture: ComponentFixture<LayingGnbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayingGnbComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayingGnbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
