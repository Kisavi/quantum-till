import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RiderList } from './rider-list';

describe('RiderList', () => {
  let component: RiderList;
  let fixture: ComponentFixture<RiderList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiderList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RiderList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
