import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Documento } from '../models/documento.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  private apiUrl = 'http://localhost:3000/documentos';

  constructor(private http: HttpClient, private authService: AuthService) {}

  subirDocumento(data: {
    tipo_documento: string;
    archivo: File;
    descripcion?: string;
  }): Observable<any> {
    const form = new FormData();
    const id = this.authService.currentUser?.id;
    if (!id) throw new Error('Usuario no autenticado');
    form.append('id_trabajador', String(id));
    form.append('tipo_documento', data.tipo_documento);
    if (data.descripcion) form.append('descripcion', data.descripcion);
    form.append('archivo', data.archivo);
    return this.http.post(`${this.apiUrl}/subir`, form);
  }

  obtenerDocumentoPorTipo(tipo: string): Observable<{ success: boolean; data: Documento }> {
    const id = this.authService.currentUser?.id;
    if (!id) throw new Error('Usuario no autenticado');
    return this.http.get<{ success: boolean; data: Documento }>(`${this.apiUrl}/${id}/${tipo}`);
  }

  eliminarDocumentoPorTipo(tipo: string): Observable<any> {
    const id = this.authService.currentUser?.id;
    if (!id) throw new Error('Usuario no autenticado');
    return this.http.delete(`${this.apiUrl}/${id}/${tipo}`);
  }

  descargarDocumento(id_documento: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id_documento}/descargar`, { responseType: 'blob' });
  }
}