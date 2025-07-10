import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogoSubirDocumentoComponent } from './dialogo-subir-documento.component';

describe('DialogoSubirDocumentoComponent', () => {
  let component: DialogoSubirDocumentoComponent;
  let fixture: ComponentFixture<DialogoSubirDocumentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoSubirDocumentoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogoSubirDocumentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
