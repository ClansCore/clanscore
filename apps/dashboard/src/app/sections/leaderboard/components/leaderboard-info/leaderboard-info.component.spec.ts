import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardInfoComponent } from './leaderboard-info.component';

describe('LeaderboardInfoComponent', () => {
  let component: LeaderboardInfoComponent;
  let fixture: ComponentFixture<LeaderboardInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderboardInfoComponent);
    component = fixture.componentInstance;
    // Set required input
    fixture.componentRef.setInput('ownPoints', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
