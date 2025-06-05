import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { SidebarComponent } from '../sidebar/sidebar.component'; // Importación directa



@Component({
  selector: 'app-usersanciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    SidebarComponent // Añadido correctamente
  ],
  templateUrl: './usersanciones.component.html',
  styleUrls: ['./usersanciones.component.css']
})
export class UsersancionesComponent {
  sanciones: any[] = [];
  sancionesFiltradas: any[] = [];
  sancionSeleccionada: any = null;
  filtroEstatus: string = 'Todas';
  paginaActual: number = 1;
  itemsPorPagina: number = 10;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarSanciones();
  }

  cargarSanciones(): void {
    // Obtener el id_trabajador del servicio de autenticación o de donde lo tengas
    const idTrabajador = 1; // Reemplaza con el id real del trabajador
    
    this.http.get<any[]>(`/api/sanciones/trabajador/${idTrabajador}`).subscribe({
      next: (data) => {
        this.sanciones = data;
        this.filtrarSanciones();
      },
      error: (err) => {
        console.error('Error al cargar sanciones:', err);
      }
    });
  }

  filtrarSanciones(): void {
    if (this.filtroEstatus === 'Todas') {
      this.sancionesFiltradas = [...this.sanciones];
    } else {
      this.sancionesFiltradas = this.sanciones.filter(
        s => s.estatus === this.filtroEstatus
      );
    }
    this.paginaActual = 1;
  }

  recargarSanciones(): void {
    this.cargarSanciones();
  }

  verDetalles(sancion: any): void {
    this.sancionSeleccionada = sancion;
    const modal = document.getElementById('detalleSancionModal');
 
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.sancionesFiltradas.length >= this.itemsPorPagina) {
      this.paginaActual++;
    }
  }

  get sancionesPaginadas(): any[] {
    const startIndex = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.sancionesFiltradas.slice(startIndex, startIndex + this.itemsPorPagina);
  }

  //metodos para la sidebar
  sidebarActive = false;

  toggleSidebar() {
    this.sidebarActive = !this.sidebarActive;
  }

    closeSidebar() {
    this.sidebarActive = false;
  }
}
