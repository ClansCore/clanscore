import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointHistoryTableComponent } from './point-history-table.component';

describe('PointHistoryTableComponent', () => {
  let component: PointHistoryTableComponent;
  let fixture: ComponentFixture<PointHistoryTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointHistoryTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointHistoryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
