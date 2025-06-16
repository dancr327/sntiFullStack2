import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Importa servicio y modelo de trabajadores
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { Trabajador } from '../../../core/models/trabajador.model';
import { NgClass, CommonModule } from '@angular/common';
// Importa servicio y modelo de secciones
import { SeccionesService } from '../../../core/services/secciones.service';
import { Seccion } from '../../../core/models/seccion.model';


@Component({
  selector: 'app-trabajadores',
  standalone: true,
  imports: [MatIconModule, RouterLink, FormsModule, NgClass, CommonModule],
  templateUrl: './trabajadores.component.html',
  styleUrl: './trabajadores.component.css',
})
export class TrabajadoresComponent implements OnInit {
  trabajadores: Trabajador[] = []; // Aquí estará tu lista general de trabajadores
  trabajadoresFiltrados: Trabajador[] = []; // Para el filtro del buscador
  secciones: Seccion[] = []; // Aquí estará tu lista de secciones

  // Variables para el filtro de búsqueda
  filtroBusqueda: string = '';
  // filtroRol: string = '';
  filtroSeccion: number | '' = '';
  // filtroSexo: string = '';

  constructor(
    private trabajadoresService: TrabajadoresService,
    private seccionesService: SeccionesService,
    private router: Router, // <-- para navegar a otras rutas
    private route: ActivatedRoute // <-- y esto para rutas hijas
  ) {}

  ngOnInit(): void {
    this.cargarTrabajadores();
    this.seccionesService.getSecciones().subscribe({
      next: (resp) => {
        if (resp.success) {
          this.secciones = resp.data;
        }
      },
      error: (err) => console.error('Error cargando secciones', err),
    });
  }

  cargarTrabajadores(): void {
    this.trabajadoresService.getTrabajadores().subscribe({
      next: (resp) => {
        // Asegúrate de que resp.data es el array de trabajadores según tu API
        this.trabajadores = resp.data || [];
        this.trabajadoresFiltrados = [...this.trabajadores];
      },
      error: (err) => {
        console.error('Error al obtener trabajadores:', err);
        this.trabajadores = [];
        this.trabajadoresFiltrados = [];
      },
    });
  }

  filtrarTrabajadores(): void {
    const filtroBusquedaLower = this.filtroBusqueda.toLowerCase().trim();

    this.trabajadoresFiltrados = this.trabajadores.filter((t) => {
      // Filtro general por texto
      const coincideBusqueda =
        (t.nombre + ' ' + t.apellido_paterno + ' ' + (t.apellido_materno || ''))
          .toLowerCase()
          .includes(filtroBusquedaLower) ||
        t.email.toLowerCase().includes(filtroBusquedaLower) ||
        t.curp.toLowerCase().includes(filtroBusquedaLower) ||
        t.numero_empleado.toLowerCase().includes(filtroBusquedaLower) ||
        t.numero_plaza.toLowerCase().includes(filtroBusquedaLower);

      // Filtro por sección
      let coincideSeccion = true;
      if (
        this.filtroSeccion !== '' &&
        this.filtroSeccion !== null &&
        this.filtroSeccion !== undefined
      ) {
        coincideSeccion = t.id_seccion === Number(this.filtroSeccion);
      }

      return coincideBusqueda && coincideSeccion;
    });
  }

  // Ejemplo de funciones para los botones (puedes implementar la lógica que necesites)

  detalleTrabajador: Trabajador | null = null;
  verTrabajador(id: number) {
    this.trabajadoresService.getTrabajadorPorId(id).subscribe({
      next: (resp) => {
        this.detalleTrabajador = resp.data; // Ajusta si tu backend retorna otro formato
      },
      error: (err) => {
        this.detalleTrabajador = null;
        alert('No se pudo cargar el trabajador.');
      },
    });
  }

editarTrabajador(id: number) {
// Navega a la ruta de edición del trabajador
  this.router.navigate(['/admin/editar-trabajador', id]);
}

  eliminarTrabajador(id: number) {
    // Mensaje de confirmación (puedes mejorar con un modal)
  if (!confirm('¿Estás seguro de que deseas eliminar este trabajador?')) {
    return;
  }
  this.trabajadoresService.eliminarTrabajador(id).subscribe({
    next: () => {
      // Elimina localmente para feedback inmediato:
      this.trabajadores = this.trabajadores.filter(t => t.id_trabajador !== id);
      this.filtrarTrabajadores(); // Aplica el filtro actualizado
      alert('Trabajador eliminado exitosamente');
    },
    error: (err) => {
      console.error('Error al eliminar trabajador:', err);
      alert('No se pudo eliminar el trabajador. Intenta nuevamente.');
    }
  });
  }
}
