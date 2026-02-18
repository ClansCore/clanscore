import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideTestStore } from '../../../../test-helpers';

import { EventPageComponent } from './event-page.component';

describe('EventPageComponent', () => {
  let component: EventPageComponent;
  let fixture: ComponentFixture<EventPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventPageComponent, NoopAnimationsModule],
      providers: [provideTestStore()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
