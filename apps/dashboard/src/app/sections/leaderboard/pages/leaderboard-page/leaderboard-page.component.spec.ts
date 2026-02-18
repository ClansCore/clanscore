import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestStore } from '../../../../test-helpers';

import { LeaderboardPageComponent } from './leaderboard-page.component';

describe('LeaderboardPageComponent', () => {
  let component: LeaderboardPageComponent;
  let fixture: ComponentFixture<LeaderboardPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardPageComponent, NoopAnimationsModule],
      providers: [provideTestStore()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
