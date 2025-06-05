import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-userperfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './userperfil.component.html',
  styleUrl: './userperfil.component.css'
})
export class UserperfilComponent {
perfilForm: FormGroup;
  editMode = false;

  constructor(
    private fb: FormBuilder,
  ) {
    this.perfilForm = this.fb.group({
      nombre: [{ value: 'Arturo', disabled: true }, Validators.required],
      apellidoPaterno: [{ value: 'Martínez', disabled: true }, Validators.required],
      apellidoMaterno: [{ value: 'Esparza', disabled: true }, Validators.required],
      fechaNacimiento: [{ value: '', disabled: true }, Validators.required],
      rfc: [{ value: 'RFC', disabled: true }, Validators.required],
      curp: [{ value: '12455FHEJ', disabled: true }, Validators.required]
    });
  }


  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.perfilForm.enable();
    } else {
      this.perfilForm.disable();
    }
  }
}
