import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalUserEventsComponent } from './modal-user-events.component';

describe('ModalUserEventsComponent', () => {
  let component: ModalUserEventsComponent;
  let fixture: ComponentFixture<ModalUserEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalUserEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalUserEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
