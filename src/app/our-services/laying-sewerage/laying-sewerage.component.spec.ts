import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayingSewerageComponent } from './laying-sewerage.component';

describe('LayingSewerageComponent', () => {
  let component: LayingSewerageComponent;
  let fixture: ComponentFixture<LayingSewerageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayingSewerageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayingSewerageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
