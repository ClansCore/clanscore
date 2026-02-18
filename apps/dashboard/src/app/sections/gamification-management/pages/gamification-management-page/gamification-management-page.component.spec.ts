import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestStore } from '../../../../test-helpers';

import { GamificationManagementPageComponent } from './gamification-management-page.component';

describe('GamificationManagementPageComponent', () => {
  let component: GamificationManagementPageComponent;
  let fixture: ComponentFixture<GamificationManagementPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamificationManagementPageComponent, NoopAnimationsModule],
      providers: [provideTestStore()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamificationManagementPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
