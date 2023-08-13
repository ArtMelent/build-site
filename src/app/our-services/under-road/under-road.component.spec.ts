import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnderRoadComponent } from './under-road.component';

describe('UnderRoadComponent', () => {
  let component: UnderRoadComponent;
  let fixture: ComponentFixture<UnderRoadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnderRoadComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnderRoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
