import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindingNetworksComponent } from './finding-networks.component';

describe('FindingNetworksComponent', () => {
  let component: FindingNetworksComponent;
  let fixture: ComponentFixture<FindingNetworksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FindingNetworksComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FindingNetworksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
