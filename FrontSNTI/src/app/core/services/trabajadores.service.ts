import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Trabajador } from '../models/trabajador.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TrabajadoresService {
  private apiUrl = 'http://localhost:3000/trabajadores'; // Cambia el puerto si tu back está en otro

  constructor(private http: HttpClient) {}

  crearTrabajador(trabajador: Trabajador): Observable<any> {
    return this.http.post(this.apiUrl, trabajador);
  }
}
