import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrenchDiggerComponent } from './trench-digger.component';

describe('TrenchDiggerComponent', () => {
  let component: TrenchDiggerComponent;
  let fixture: ComponentFixture<TrenchDiggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrenchDiggerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrenchDiggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
