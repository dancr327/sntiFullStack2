import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserdocumentosComponent } from './userdocumentos.component';

describe('UserdocumentosComponent', () => {
  let component: UserdocumentosComponent;
  let fixture: ComponentFixture<UserdocumentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserdocumentosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserdocumentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
