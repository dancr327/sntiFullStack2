import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink,ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  get email(){
    return this.formLogin.get('email') as FormControl;
  }
  get curp(){
    return this.formLogin.get('curp') as FormControl;
  }
  get password(){
    return this.formLogin.get('password') as FormControl;
  }

  formLogin = new FormGroup({
    'email': new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]),
    'curp': new FormControl('', [Validators.required, Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/)]),
    'password': new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  //metodo uppercase para convertir el texto a mayusculas
toUppercase(controlName: string, event: Event) {
  const input = event.target as HTMLInputElement;
  const uppercaseValue = input.value.toUpperCase();
  this.formLogin.get(controlName)?.setValue(uppercaseValue);
}

}
