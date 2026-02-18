import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestStore } from '../../../../test-helpers';

import { TaskPageComponent } from './task-page.component';

describe('TaskPageComponent', () => {
  let component: TaskPageComponent;
  let fixture: ComponentFixture<TaskPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskPageComponent, NoopAnimationsModule],
      providers: [provideTestStore()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
