import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PermisosService } from '../../../core/services/permisos.service';
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { AuthService } from '../../../core/services/auth.service';

import { Permiso } from '../../../core/models/permiso.model';
import { Trabajador } from '../../../core/models/trabajador.model';
import { Usuario } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [MatIconModule, MatCardModule, CommonModule, FormsModule],
  templateUrl: './permisos.component.html',
  styleUrl: './permisos.component.css',
})
export class PermisosComponent implements OnInit {
  filtroBusqueda: string = '';
  filtroEstatus: string = 'Todas'; // Nuevo filtro para estatus
  permisos: Permiso[] = [];
  permisosFiltrados: Permiso[] = [];
  trabajadores: Trabajador[] = [];
  archivoSeleccionado: File | null = null;
  permisoSeleccionado: Permiso | null = null;

  usuarioActual: Usuario | null = null;

  nuevaPermiso: any = {
    id_trabajador: '',
    tipo_permiso: '',
    motivo: '',
    fecha_inicio: '',
    fecha_fin: '',
    estatus: 'Pendiente',
  };

  constructor(
    private permisosService: PermisosService,
    private trabajadoresService: TrabajadoresService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.currentUser;
    this.cargarPermisos();
    this.cargarTrabajadores();
  }


  cargarTrabajadores(): void {
  this.trabajadoresService.getTrabajadores().subscribe({
    next: (resp) => {
      // Tipa 'todos' como Trabajador[]
      const todos: Trabajador[] = resp.data || [];
      if (this.usuarioActual?.seccion?.id_seccion) {
        this.trabajadores = todos.filter(
          (t: Trabajador) => t.id_seccion === this.usuarioActual!.seccion.id_seccion
        );
      } else if (this.usuarioActual?.seccion?.estado) {
        this.trabajadores = todos.filter(
          (t: Trabajador) =>
            t.seccion?.estado === this.usuarioActual!.seccion.estado
        );
      } else {
        this.trabajadores = todos;
      }
    },
    error: (err) => {
      this.trabajadores = [];
      console.error('Error al obtener trabajadores:', err);
    },
  });
}
  cargarPermisos(): void {
    this.permisosService.getPermisos().subscribe({
      next: (resp) => {
        // Resp puede ser {success, data: Permiso[]}
        let todos = resp.data || [];
        // Filtrar solo los permisos de trabajadores de la misma sección/estado
        if (this.usuarioActual?.seccion?.id_seccion) {
          todos = todos.filter(
            (p) =>
              p.trabajadores &&
              p.trabajadores.seccion &&
              p.trabajadores.seccion.id_seccion === this.usuarioActual!.seccion.id_seccion
          );
        } else if (this.usuarioActual?.seccion?.estado) {
          // Alternativamente, por estado:
          todos = todos.filter(
            (p) =>
              p.trabajadores &&
              p.trabajadores.seccion &&
              p.trabajadores.seccion.estado === this.usuarioActual!.seccion.estado
          );
        }
        this.permisos = todos;
        this.permisosFiltrados = [...todos];
      },
      error: (err) => {
        this.permisos = [];
        this.permisosFiltrados = [];
        console.error('Error al obtener permisos:', err);
      },
    });
  }


   onFileSelected(event: any): void {
    this.archivoSeleccionado = event.target.files[0];
  }

  guardarPermiso(): void {

  const inicio = new Date(this.nuevaPermiso.fecha_inicio);
  const fin = new Date(this.nuevaPermiso.fecha_fin);
  if (inicio > fin) {
      alert('La fecha de finalizacion no puede ser antes que la fecha de inicio.');
      return;
    }
    if (!this.archivoSeleccionado) {
      alert('Debes subir un documento de aprobación.');
      return;
    }
    const formData = new FormData();
    Object.entries(this.nuevaPermiso).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });
    formData.append('aprobacion', this.archivoSeleccionado);

    this.permisosService.crearPermiso(formData).subscribe({
      next: (resp: any) => {
        this.cargarPermisos();
        this.resetForm();
        // Cierra el modal manualmente si usas Bootstrap JS
        const modalEl = document.getElementById('permisoModal');
        if (modalEl)
          (window as any).bootstrap?.Modal.getInstance(modalEl)?.hide();
        alert('Permiso creado exitosamente.');
      },
      error: (err) => {
        alert('No se pudo guardar el permiso. Intenta nuevamente.');
        console.error(err);
      },
    });
  }

  eliminarPermiso(id: number): void {
    if (confirm('¿Está seguro de eliminar este permiso?')) {
      this.permisosService.eliminarPermiso(id).subscribe({
        next: () => {
          this.cargarPermisos();
        },
        error: (err) => {
          alert('No se pudo eliminar el permiso. Intenta nuevamente.');
          console.error(err);
        },
      });
    }
  }

  verDetalles(permiso: Permiso): void {
    this.permisoSeleccionado = permiso;
    const modalEl = document.getElementById('detalleModal');
    if (modalEl)
      (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl).show();
  }

  descargarDocumento(permiso: Permiso): void {
  if (!permiso.documentos) {
    alert('No hay documento para descargar.');
    return;
  }
  const fileName = permiso.documentos.nombre_archivo || 'documento.pdf';
  this.permisosService
  // Se ajustó el componente de administración de permisos para cargar el archivo bajo el nuevo campo “aprobación” y para solicitar descargas utilizando el ID del permiso (cambio hecho por daniel)
    .descargarDocumento(permiso.id_permiso) 
    .subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);  // <--- ¡IMPORTANTE! para algunos navegadores
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert('No se pudo descargar el documento.');
        console.error(err);
      }
    });
}

  filtrarPermisos(): void {

    const termino = this.filtroBusqueda.toLowerCase();
    this.permisosFiltrados = this.permisos.filter((p) => {
      const coincideBusqueda = !termino ||
        `${p.trabajadores.nombre} ${p.trabajadores.apellido_paterno} ${p.trabajadores.apellido_materno}`
          .toLowerCase().includes(termino) ||
        (p.tipo_permiso ?? '').toLowerCase().includes(termino) ||
        p.motivo.toLowerCase().includes(termino) ||
        (p.estatus ?? '').toLowerCase().includes(termino);
      const coincideEstatus = this.filtroEstatus === 'Todas' || p.estatus === this.filtroEstatus;
      return coincideBusqueda && coincideEstatus;
    });
  }
// Método para aplicar la fecha mínima de inicio (3 meses atrás)
  get minFechaInicio(): string {
  const hoy = new Date();
  // Restar 3 meses
  hoy.setMonth(hoy.getMonth() - 3);
  // Formatear a yyyy-MM-dd
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
get fechaFinInvalida(): boolean {
  const inicio = this.nuevaPermiso.fecha_inicio;
  const fin = this.nuevaPermiso.fecha_fin;
  // Si ambos existen y la fecha fin es menor que inicio, error
  return inicio && fin && fin < inicio;
}

  resetForm(): void {
    this.nuevaPermiso = {
      id_trabajador: '',
      tipo_permiso: '',
      motivo: '',
      fecha_inicio: '',
      fecha_fin: '',
      estatus: 'Pendiente',
    };
    this.archivoSeleccionado = null;
  }
}