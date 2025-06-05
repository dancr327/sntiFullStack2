import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Trabajadores {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento: string;
  sexo: string;
  curp: string;
  rfc: string;
  email: string;
  situacion_sentimental?: string; //es opcional pero yo lo pondría como obligatorio
  numero_hijos: number;
  numero_empleado: string;
  numero_plaza: string;
  fecha_ingreso: string;
  fecha_ingreso_gobierno: string;
  nivel_puesto: string;
  nombre_puesto: string;
  puesto_inpi?: string;
  adscripcion: string;
  id_seccion: number;
  nivel_estudios?: string;
  institucion_estudios?: string;
  certificado_estudios?: boolean;
  plaza_base?: string;  //campo opcional pero yo lo pondría como obligatorio
  fecha_actualizacion?: string; //campo opcional pero yo lo pondría como obligatorio
}


@Injectable({
  providedIn: 'root'
})
export class TrabajadoresService {
private API_URL =  'http://localhost:3000/trabajadores'; // Ajusta según tu backend

  constructor(private http: HttpClient) { }

  crearTrabajador(trabajadores: Trabajadores): Observable<Trabajadores> {
    return this.http.post<Trabajadores>(this.API_URL, trabajadores);
    }

  // Método GET para obtener todos los trabajadores
  obtenerTrabajadores(): Observable<Trabajadores[]> {
    return this.http.get<Trabajadores[]>(this.API_URL);
  }

    // Método GET para un trabajador por ID (opcional)
  obtenerTrabajadorPorId(id: number): Observable<Trabajadores> {
    return this.http.get<Trabajadores>(`${this.API_URL}/${id}`);
  }
}
