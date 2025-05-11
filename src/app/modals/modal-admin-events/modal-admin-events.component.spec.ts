import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAdminEventsComponent } from './modal-admin-events.component';

describe('ModalAdminEventsComponent', () => {
  let component: ModalAdminEventsComponent;
  let fixture: ComponentFixture<ModalAdminEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAdminEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAdminEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
