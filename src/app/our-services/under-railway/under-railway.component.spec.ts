import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnderRailwayComponent } from './under-railway.component';

describe('UnderRailwayComponent', () => {
  let component: UnderRailwayComponent;
  let fixture: ComponentFixture<UnderRailwayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnderRailwayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnderRailwayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
