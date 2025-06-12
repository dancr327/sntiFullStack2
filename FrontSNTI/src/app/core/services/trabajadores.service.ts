import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Trabajador } from '../models/trabajador.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TrabajadoresService {
  private apiUrl = 'http://localhost:3000/trabajadores'; // Cambia el puerto si tu back está en otro

  constructor(private http: HttpClient) {}
  // registro-empleado.componente.ts (admin)
  // Metodo para crear un nuevo trabajador en un formulario (admin)
  crearTrabajador(trabajador: Trabajador): Observable<any> {
    return this.http.post(this.apiUrl, trabajador);
  }
  // trabajadores.componente.ts (admin)
  // Metodo para ver todos los trabajadores y filtrarlos(admin)
  getTrabajadores(): Observable<any> {
  return this.http.get('http://localhost:3000/trabajadores');
}
//perfil.componente.ts (user)
  // Metodo para ver el perfil del trabajador logeado (user)
  getMiPerfil(): Observable<any> {
  return this.http.get(`${this.apiUrl}/mi-perfil`);
}

//trabajadores.componente.ts (admin)
// Metodo ver un trabajador por ID (admin) (usado en el detalle del trabajador)
getTrabajadorPorId(id: number): Observable<any> {
  return this.http.get(`http://localhost:3000/trabajadores/${id}`);
}

actualizarTrabajador(id: number, trabajador: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/${id}`, trabajador);
}
// trabajadores.componente.ts (admin)
eliminarTrabajador(id: number) {
  return this.http.delete<any>(`${this.apiUrl}/${id}`);
}


}
