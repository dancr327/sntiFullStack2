import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Seccion } from '../models/seccion.model';

@Injectable({
  providedIn: 'root'
})
export class SeccionesService {
  private apiUrl = 'http://localhost:3000/secciones'; // Ajusta el puerto/endpoint si es necesario

  constructor(private http: HttpClient) {}

  getSecciones(): Observable<{ success: boolean, data: Seccion[] }> {
    return this.http.get<{ success: boolean, data: Seccion[] }>(this.apiUrl);
  }

  // Si necesitas obtener una sección específica:
  getSeccionPorId(id: number): Observable<{ success: boolean, data: Seccion }> {
    return this.http.get<{ success: boolean, data: Seccion }>(`${this.apiUrl}/${id}`);
  }
  // Puedes agregar métodos POST, PUT, DELETE si vas a administrar las secciones desde el frontend
}
