import { Component } from '@angular/core';
import { FormControl,FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

//TrabajadoresService sirve para hacer peticiones al backend
import { Trabajadores, TrabajadoresService } from '../../../core/services/admin/trabajadores.service';
import { from } from 'rxjs';

@Component({
  selector: 'app-registro-empleado',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ],
  templateUrl: './registro-empleado.component.html',
  styleUrl: './registro-empleado.component.css'
})
export class RegistroEmpleadoComponent {

//getters para acceder a los controles del formulario
// de manera mas sencilla, sin tener que escribir formEmpleado.get('name') cada vez
get nombre(){
  return this.formEmpleado.get('nombre') as FormControl;
}
get email(){
  return this.formEmpleado.get('email') as FormControl;
}
get apellido_paterno(){
  return this.formEmpleado.get('apellido_paterno') as FormControl;
}
get apellido_materno(){
  return this.formEmpleado.get('apellido_materno') as FormControl;
}
get fecha_nacimiento(){
  return this.formEmpleado.get('fecha_nacimiento') as FormControl;
}
get sexo(){
  return this.formEmpleado.get('sexo') as FormControl;
}
get curp(){
  return this.formEmpleado.get('curp') as FormControl;
}
get rfc(){
  return this.formEmpleado.get('rfc') as FormControl;
}
get situacion_sentimental(){
  return this.formEmpleado.get('situacion_sentimental') as FormControl;
}
get numero_hijos(){
  return this.formEmpleado.get('numero_hijos') as FormControl;
}
get numero_empleado(){
  return this.formEmpleado.get('numero_empleado') as FormControl;
}
get numero_plaza(){
  return this.formEmpleado.get('numero_plaza') as FormControl;
}
get fecha_ingreso(){
  return this.formEmpleado.get('fecha_ingreso') as FormControl;
}
get fecha_ingreso_gobierno(){
  return this.formEmpleado.get('fecha_ingreso_gobierno') as FormControl;
}
get nivel_puesto(){
  return this.formEmpleado.get('nivel_puesto') as FormControl;
}
get nombre_puesto(){
  return this.formEmpleado.get('nombre_puesto') as FormControl;
}
get puesto_inpi(){
  return this.formEmpleado.get('puesto_inpi') as FormControl;
}
get adscripcion(){
  return this.formEmpleado.get('adscripcion') as FormControl;
}
get id_seccion(){
  return this.formEmpleado.get('id_seccion') as FormControl;
}
get nivel_estudios(){
  return this.formEmpleado.get('nivel_estudios') as FormControl;
}
get institucion_estudios(){
  return this.formEmpleado.get('institucion_estudios') as FormControl;
}
get certificado_estudios(){
  return this.formEmpleado.get('certificado_estudios') as FormControl;
}
get plaza_base(){
  return this.formEmpleado.get('plaza_base') as FormControl;
}
get fecha_actualizacion(){
  return this.formEmpleado.get('fecha_actualizacion') as FormControl;
}

  formEmpleado= new FormGroup({ 
   // con validators.riquired se indica que el campo es requerido
    'nombre': new FormControl('',[Validators.required,Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]),
    'apellido_paterno': new FormControl('',[Validators.required,Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]),
    'apellido_materno': new FormControl('',[Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]),// el apellido materno no es requerido (campo opcional)
    'fecha_nacimiento': new FormControl('',[Validators.required,this.validarRangoEdad()]),
    'sexo': new FormControl('',Validators.required),
    'curp': new FormControl('', [Validators.required, Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/)]),
    'rfc':new FormControl ('', [Validators.required, Validators.pattern(/^([A-ZÑ&]{3,4})\d{6}([A-Z\d]{3})$/)]),
  // cuando quiero implementar mas de una validacion, se hace con un array
  // en este caso "el campo es requerido" y "tiene que ser un email"

    'email': new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]),
    'situacion_sentimental': new FormControl('',), //el campo es opcional
    'numero_empleado': new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{10}$/)]),
    'numero_hijos': new FormControl(0,[Validators.required, Validators.min(0), Validators.max(10)]),
    'numero_plaza': new FormControl('',[Validators.required,Validators.min(0), Validators.max(1000)]),
    'fecha_ingreso': new FormControl('',[Validators.required, this.validarAntiguedadDesde1980()]),
    'fecha_ingreso_gobierno': new FormControl ('', [Validators.required, this.validarAntiguedadMaxima()]),
    'nivel_puesto': new FormControl('',[Validators.required,Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]),
    'nombre_puesto': new FormControl('',[Validators.required,Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]),
    'puesto_inpi': new FormControl('',[Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]), //el campo es opcional
    'adscripcion': new FormControl('', Validators.required),
    'id_seccion': new FormControl(1, Validators.required),
    'nivel_estudios': new FormControl('',),// el campo es opcional
    'institucion_estudios': new FormControl ('',[Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]), //el campo es opcional
    'certificado_estudios': new FormControl(false),
    'plaza_base': new FormControl ('',[Validators.pattern(/^[A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9][A-Za-zÁÉÍÓÚÑáéíóúüÜ0-9\s.'-]*$/)]), //el campo es opcional
    'fecha_actualizacion': new FormControl (this.formatearFechaParaInput(new Date()), [ this.validarFechaDesde2024()]), //campo opcional
  });


 
  mostarDatos(){
    console.log(this.formEmpleado.value);
  }

// CODIGO fechas

// Fechas límite para validaciones
hoy = new Date();
fechaMinNacimiento = new Date('1950-01-01');
fechaMaxNacimiento = new Date();
fechaMinIngreso = new Date('1980-01-01');
fechaMinIngresoGobierno = new Date('1980-01-01');
fechaMinActualizacion = new Date('2024-01-01');

constructor(
  
  private trabajadoresService: TrabajadoresService // inyectar el servicio de trabajadores
) {
  this.fechaMaxNacimiento.setFullYear(this.hoy.getFullYear() - 18);
}

// Valida que la fecha de nacimiento sea entre 1 enero 1950 y hace 18 años
validarRangoEdad(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    if (fecha < this.fechaMinNacimiento || fecha > this.fechaMaxNacimiento) {
      return { edadInvalida: true };
    }
    return null;
  };
}

// Valida que la fecha de ingreso sea entre 1 enero 1980 y hoy
validarAntiguedadDesde1980(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    if (fecha < this.fechaMinIngreso || fecha > this.hoy) {
      return { antiguedadInvalida: true };
    }
    return null;
  };
}
validarAntiguedadMaxima(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    if (fecha < this.fechaMinIngresoGobierno || fecha > this.hoy) {
      return { antiguedadGobiernoInvalida: true };
    }
    return null;
  }
  };
  // formatearFechaParaInput que convierte la fecha actual (Date) en un string con el formato YYYY-MM-DD, que es el formato que entienden los inputs tipo date en HTML.
  formatearFechaParaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const day = fecha.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  validarFechaDesde2024(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const fecha = new Date(control.value);
      if (!control.value) return null;
  
      const fechaMin = new Date('2024-01-01');
      fechaMin.setHours(0, 0, 0, 0); // aseguramos que no haya errores por tiempo
  
      return fecha < fechaMin || fecha > this.hoy
        ? { fechaFueraDeRango: true }
        : null;
    };
  }
  


//metodo uppercase para convertir el texto a mayusculas
toUppercase(controlName: string, event: Event) {
  const input = event.target as HTMLInputElement;
  const uppercaseValue = input.value.toUpperCase();
  this.formEmpleado.get(controlName)?.setValue(uppercaseValue);
}

//codigo para hace post a trabajadores
private formatearFechaISO(fecha: string | null): string {
  if (!fecha) return '';
  const date = new Date(fecha);
  return date.toISOString().split('T')[0]; // Regresa yyyy-MM-dd
}


onSubmit() {
  // Validar si el formulario es válido antes de enviar
  // Si el formulario es válido, puedes enviar los datos al backend
    if (this.formEmpleado.valid) {

    const formValue = this.formEmpleado.value;
    // Convertir las fechas a formato ISO
    // y asegurarse de que sean cadenas
    const trabajadorData = {
      ...formValue,
      fecha_nacimiento: new Date(formValue.fecha_nacimiento!).toISOString(),
      fecha_ingreso: new Date(formValue.fecha_ingreso!).toISOString(),
      fecha_ingreso_gobierno: new Date(formValue.fecha_ingreso_gobierno!).toISOString(),
      fecha_actualizacion: new Date(formValue.fecha_actualizacion!).toISOString(),
    } as Trabajadores;
    

      this.trabajadoresService.crearTrabajador(trabajadorData)
        .subscribe({
          next: (res) => {
            console.log('Empleado creado:', res);
            // Resetear formulario o redireccionar
          },
          error: (err) => {
            console.error('Error:', err);
          }
        });
    }
  }

 
}
