import { Component, OnInit  } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AdminbarraComponent } from '../adminbarra/adminbarra.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sanciones',
  standalone: true,
  imports: [MatIconModule, RouterLink, AdminbarraComponent, CommonModule,FormsModule ],
  templateUrl: './sanciones.component.html',
  styleUrl: './sanciones.component.css'
})
export class SancionesComponent implements OnInit {
  filtroBusqueda: string = '';
  sanciones: any[] = [];
  sancionesFiltradas: any[] = [];
  trabajadores: any[] = [];
  archivoSeleccionado: File | null = null;
  sancionSeleccionada: any = null;
  
  nuevaSancion = {
    trabajador_id: '',
    trabajador_nombre: '',
    tipo: '',
    descripcion: '',
    fecha_aplicacion: '',
    fecha_fin: '',
    estatus: 'Activa',
    documento: null as string | null,
    fecha_registro: new Date()
  };

  ngOnInit(): void {
    // Datos de ejemplo
    this.trabajadores = [
   
    ];
    
    this.sanciones = [
      {
       
      },
      {
        
      }
    ];
    
    this.sancionesFiltradas = [...this.sanciones];
  }

  onFileSelected(event: any): void {
    this.archivoSeleccionado = event.target.files[0];
  }

  guardarSancion(): void {
    // Asignar nombre del trabajador
    const trabajador = this.trabajadores.find(t => t.id == this.nuevaSancion.trabajador_id);
    if (trabajador) {
      this.nuevaSancion.trabajador_nombre = `${trabajador.nombre} ${trabajador.apellido}`;
    }
    
    // Asignar documento si se seleccionó
    if (this.archivoSeleccionado) {
      this.nuevaSancion.documento = this.archivoSeleccionado.name;
    }
    
    // Generar ID y agregar sanción
    const nuevaId = this.sanciones.length > 0 
      ? Math.max(...this.sanciones.map(s => s.id)) + 1 
      : 1;
    
    const sancion = {
      ...this.nuevaSancion,
      id: nuevaId
    };
    
    this.sanciones.unshift(sancion);
    this.sancionesFiltradas = [...this.sanciones];
    this.resetForm();
    
    // Cerrar modal
    document.getElementById('closeModal')?.click();
  }

  eliminarSancion(id: number): void {
    if (confirm('¿Está seguro de eliminar esta sanción?')) {
      this.sanciones = this.sanciones.filter(s => s.id !== id);
      this.sancionesFiltradas = [...this.sanciones];
    }
  }

  verDetalles(sancion: any): void {
    this.sancionSeleccionada = sancion;
    // Mostrar modal de detalles
    // Necesitarías Bootstrap JS o ng-bootstrap para esto
  }

  filtrarSanciones(): void {
    if (!this.filtroBusqueda) {
      this.sancionesFiltradas = [...this.sanciones];
      return;
    }
    
    const termino = this.filtroBusqueda.toLowerCase();
    this.sancionesFiltradas = this.sanciones.filter(s =>
      s.trabajador_nombre.toLowerCase().includes(termino) ||
      s.tipo.toLowerCase().includes(termino) ||
      s.descripcion.toLowerCase().includes(termino) ||
      s.estatus.toLowerCase().includes(termino)
    );
  }

  resetForm(): void {
    this.nuevaSancion = {
      trabajador_id: '',
      trabajador_nombre: '',
      tipo: '',
      descripcion: '',
      fecha_aplicacion: '',
      fecha_fin: '',
      estatus: 'Activa',
      documento: null,
      fecha_registro: new Date()
    };
    this.archivoSeleccionado = null;
  }

}
