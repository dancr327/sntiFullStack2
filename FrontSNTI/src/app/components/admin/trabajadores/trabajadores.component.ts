import { Component,  OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-trabajadores',
  standalone: true,
  imports: [MatIconModule, RouterLink, FormsModule,  RouterOutlet ],
  templateUrl: './trabajadores.component.html',
  styleUrl: './trabajadores.component.css'
})
export class TrabajadoresComponent implements OnInit {
  filtroBusqueda: string = '';
  trabajadores: any[] = [];
  trabajadoresFiltrados: any[] = [];

  ngOnInit(): void {
    
    
  }

  filtrarTrabajadores(): void {
    if (!this.filtroBusqueda) {
      this.trabajadoresFiltrados = [...this.trabajadores];
      return;
    }

    const termino = this.filtroBusqueda.toLowerCase();
    this.trabajadoresFiltrados = this.trabajadores.filter(t =>
      t.nombre.toLowerCase().includes(termino) ||
      t.apellido.toLowerCase().includes(termino) ||
      t.puesto.toLowerCase().includes(termino) ||
      t.departamento.toLowerCase().includes(termino) ||
      t.email.toLowerCase().includes(termino) ||
      t.telefono.includes(termino)
    );
  }

}