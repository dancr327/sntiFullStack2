import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PermisosService } from '../../../core/services/permisos.service';
import { Permiso } from '../../../core/models/permiso.model';

@Component({
  selector: 'app-userpermiso',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './userpermiso.component.html',
  styleUrl: './userpermiso.component.css'
})
export class UserpermisoComponent implements OnInit {
  permisos: Permiso[] = [];
  permisosActivos: Permiso[] = [];
  permisosCaducados: Permiso[] = [];
  permisoSeleccionado: Permiso | null = null;

  constructor(private permisosService: PermisosService) {}

  ngOnInit(): void {
    this.cargarPermisos();
  }

  cargarPermisos(): void {
    this.permisosService.getMisPermisos().subscribe({
      next: (resp) => {
        this.permisos = resp.data || [];
        this.categorizarPermisos();
      },
      error: (err) => {
        console.error('Error al obtener permisos:', err);
        this.permisos = [];
        this.permisosActivos = [];
        this.permisosCaducados = [];
      }
    });
  }
  categorizarPermisos(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ajustar = (fecha: string) => {
      const d = new Date(fecha);
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
      return d;
    };
    this.permisosActivos = this.permisos.filter(p => {
      const fin = ajustar(p.fecha_fin);
      fin.setDate(fin.getDate() + 1);
      return fin.getTime() > hoy.getTime();
    });
    this.permisosCaducados = this.permisos.filter(p => {
      const fin = ajustar(p.fecha_fin);
      fin.setDate(fin.getDate() + 1);
      return fin.getTime() <= hoy.getTime();
    });
  }

   verDetalles(permiso: Permiso): void {
    this.permisoSeleccionado = permiso;
    const modalEl = document.getElementById('detallePermisoModal');
    if (modalEl) {
      (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl).show();
    }
  }
  
  descargarDocumento(permiso: Permiso): void {
    if (!permiso.documentos) {
      alert('No hay documento para descargar.');
      return;
    }
    const nombre = permiso.documentos.nombre_archivo || 'documento.pdf';
    this.permisosService.descargarDocumento(permiso.id_permiso).subscribe({ 
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('No se pudo descargar el documento.');
        console.error(err);
      }
    });
  }
}
