import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstrumentsComponent } from './instruments';

describe('Instruments', () => {
  let component: InstrumentsComponent;
  let fixture: ComponentFixture<InstrumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InstrumentsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
