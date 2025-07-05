import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SancionesService } from '../../../core/services/sanciones.service';


@Component({
  selector: 'app-usersanciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './usersanciones.component.html',
  styleUrls: ['./usersanciones.component.css']
})
export class UsersancionesComponent implements OnInit {
  sanciones: any[] = [];
  sancionesFiltradas: any[] = [];
  sancionSeleccionada: any = null;
  filtroEstatus: string = 'Todas';
  paginaActual: number = 1;
  itemsPorPagina: number = 10;

  constructor(private sancionesService: SancionesService) {}

  ngOnInit(): void {
    this.cargarSanciones();
  }

  cargarSanciones(): void {
     const estatus = this.filtroEstatus === 'Todas' ? undefined : this.filtroEstatus;
    this.sancionesService.getMisSanciones(estatus).subscribe({
      next: (resp) => {
        this.sanciones = resp.data || [];
        this.sancionesFiltradas = [...this.sanciones];
        this.paginaActual = 1;
      },
      error: (err) => {
        console.error('Error al cargar sanciones:', err);
      }
    });
  }

  filtrarSanciones(): void {
    this.cargarSanciones();
  }

  recargarSanciones(): void {
    this.cargarSanciones();
  }

  verDetalles(sancion: any): void {
    this.sancionSeleccionada = sancion;
    const modalEl = document.getElementById('detalleSancionModal');
    if (modalEl) {
      (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl).show();
    }
 
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
