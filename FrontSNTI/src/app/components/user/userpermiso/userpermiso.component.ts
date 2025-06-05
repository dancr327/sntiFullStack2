import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SidebarComponent  } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-userpermiso',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './userpermiso.component.html',
  styleUrl: './userpermiso.component.css'
})
export class UserpermisoComponent {
  permiso = {
    id_trabajador: null,
    tipo_permiso: '',
    fecha_inicio: '',
    fecha_fin: '',
    motivo: '',
    estatus: 'Pendiente', // Valor por defecto
    documento_aprobacion_id: null
  };

  constructor(private http: HttpClient, private router: Router) {}

  solicitarPermiso() {
    // Llamar a la función PostgreSQL a través de tu API
    this.http.post('/api/permisos', this.permiso).subscribe({
      next: (response) => {
        alert('Permiso solicitado correctamente');
        this.router.navigate(['/mis-permisos']);
      },
      error: (err) => {
        console.error('Error al solicitar permiso:', err);
        alert('Error al solicitar permiso');
      }
    });
  }

  cancelar() {
    if(confirm('¿Está seguro que desea cancelar la solicitud?')) {
      this.router.navigate(['/dashboard']);
    }
  }

}
@Injectable({
  providedIn: 'root'
})
export class PermisoService {
  private apiUrl = '/api/permisos';

  constructor(private http: HttpClient) { }

  insertarPermiso(permisoData: any) {
    return this.http.post(`${this.apiUrl}/insertar`, permisoData);
  }
  
}