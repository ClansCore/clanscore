import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RewardFormComponent } from './reward-form.component';

describe('RewardFormComponent', () => {
  let component: RewardFormComponent;
  let fixture: ComponentFixture<RewardFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RewardFormComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { reward: {}, title: 'Test', confirmationText: 'Test' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RewardFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
