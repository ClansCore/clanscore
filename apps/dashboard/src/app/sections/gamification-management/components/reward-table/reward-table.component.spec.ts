import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamificationRewardTableComponent } from './reward-table.component';

describe('GamificationRewardTableComponent', () => {
  let component: GamificationRewardTableComponent;
  let fixture: ComponentFixture<GamificationRewardTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamificationRewardTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamificationRewardTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
