import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permiso } from '../models/permiso.model';

@Injectable({ providedIn: 'root' })
export class PermisosService {
  private apiUrl = 'http://localhost:3000/permisos'; // Ajusta la URL según tu backend

  constructor(private http: HttpClient) {}

  getPermisos(): Observable<{ success: boolean; data: Permiso[] }> {
    return this.http.get<{ success: boolean; data: Permiso[] }>(this.apiUrl);
  }

  crearPermiso(formData: FormData) {
    return this.http.post(this.apiUrl, formData);
  }

  eliminarPermiso(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  descargarDocumento(id_documento: number) {
  return this.http.get(`http://localhost:3000/permisos/documento/${id_documento}/descargar`, {
    responseType: 'blob'
  });
}
}