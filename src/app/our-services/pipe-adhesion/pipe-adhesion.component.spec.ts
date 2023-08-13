import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipeAdhesionComponent } from './pipe-adhesion.component';

describe('PipeAdhesionComponent', () => {
  let component: PipeAdhesionComponent;
  let fixture: ComponentFixture<PipeAdhesionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PipeAdhesionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PipeAdhesionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
