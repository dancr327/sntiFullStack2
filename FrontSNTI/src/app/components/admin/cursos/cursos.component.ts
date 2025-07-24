import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CursosService } from '../../../core/services/cursos.service';
import { TrabajadoresCursosService } from '../../../core/services/trabajadores-cursos.service';
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { Curso } from '../../../core/models/curso.model';
import { Trabajador } from '../../../core/models/trabajador.model';
import { TrabajadorCurso } from '../../../core/models/trabajador-curso.model';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.css'
})
export class CursosComponent implements OnInit {
  cursos: Curso[] = [];
  trabajadores: Trabajador[] = [];
  inscripciones: TrabajadorCurso[] = [];

  cursoSeleccionado: Curso | null = null;
  filtroBusqueda = '';
  filtroSeccion = '';
  trabajadorAgregar: number | '' = '';
   nuevoCurso = { codigo_curso: '', nombre_curso: '', horas_duracion: 1 };
  archivoConstancia: File | null = null;

  constructor(
    private cursosService: CursosService,
    private trabajadoresCursosService: TrabajadoresCursosService,
    private trabajadoresService: TrabajadoresService
  ) {}

  ngOnInit(): void {
    this.cargarCursos();
    this.cargarTrabajadores();
    this.cargarInscripciones();
  }

  cargarCursos(): void {
    this.cursosService.getCursos().subscribe({
      next: resp => (this.cursos = resp.data || []),
      error: () => (this.cursos = [])
    });
  }

  cargarTrabajadores(): void {
    this.trabajadoresService.getTrabajadores().subscribe({
      next: resp => (this.trabajadores = resp.data || []),
      error: () => (this.trabajadores = [])
    });
  }

  cargarInscripciones(): void {
    this.trabajadoresCursosService.getInscripciones().subscribe({
      next: resp => (this.inscripciones = resp.data || []),
      error: () => (this.inscripciones = [])
    });
  }

    trabajadoresDelCurso(id_curso: number): TrabajadorCurso[] {
    return this.inscripciones.filter(i => i.id_curso === id_curso);
  }


  abrirDetalle(curso: Curso) {
    this.cursoSeleccionado = curso;
    const modalEl = document.getElementById('detalleModal');
    if (modalEl) (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl).show();
  }

  abrirAgregarTrabajador(curso: Curso) {
    this.cursoSeleccionado = curso;
    this.trabajadorAgregar = '';
    this.filtroBusqueda = '';
    this.filtroSeccion = '';
    const modalEl = document.getElementById('agregarModal');
    if (modalEl) (window as any).bootstrap?.Modal.getOrCreateInstance(modalEl).show();
  }

  filtrarTrabajadores(): Trabajador[] {
    return this.trabajadores
      .filter(t =>
        this.filtroSeccion ? String(t.seccion?.numero_seccion) === this.filtroSeccion : true
      )
      .filter(t => {
        const term = this.filtroBusqueda.toLowerCase();
        if (!term) return true;
        return (
          t.nombre.toLowerCase().includes(term) ||
          t.apellido_paterno.toLowerCase().includes(term) ||
          (t.apellido_materno || '').toLowerCase().includes(term) ||
          t.numero_empleado.toLowerCase().includes(term)
        );
      });
  }

  agregarTrabajador() {
    if (!this.trabajadorAgregar || !this.cursoSeleccionado) return;
    const formData = new FormData();
    formData.append('id_trabajador', String(this.trabajadorAgregar));
    formData.append('id_curso', String(this.cursoSeleccionado.id_curso));
    formData.append('tipo_documento', 'INVITACION_CURSO');
    this.trabajadoresCursosService.crearInscripcionAdmin(formData).subscribe({
      next: () => {
        this.cargarInscripciones();
        const modalEl = document.getElementById('agregarModal');
        if (modalEl) (window as any).bootstrap?.Modal.getInstance(modalEl)?.hide();
      },
      error: () => alert('No se pudo agregar el trabajador')
    });
  }

  prepararNuevoCurso() {
    this.nuevoCurso = { codigo_curso: '', nombre_curso: '', horas_duracion: 1 };
    this.archivoConstancia = null;
  }

  onFileSelected(event: any) {
    this.archivoConstancia = event.target.files[0];
  }

  crearCurso(): void {
    if (this.cursos.some(c => c.codigo_curso === this.nuevoCurso.codigo_curso)) {
      alert('El código del curso ya existe');
      return;
    }
    if (this.cursos.some(c => c.nombre_curso === this.nuevoCurso.nombre_curso)) {
      alert('El nombre del curso ya existe');
      return;
    }
    if (!this.archivoConstancia) {
      alert('Debes subir la constancia del curso.');
      return;
    }
    const formData = new FormData();
    formData.append('codigo_curso', this.nuevoCurso.codigo_curso);
    formData.append('nombre_curso', this.nuevoCurso.nombre_curso);
    formData.append('horas_duracion', String(this.nuevoCurso.horas_duracion));
    formData.append('documento_constancia', this.archivoConstancia);
    this.cursosService.crearCurso(formData).subscribe({
      next: () => {
        this.cargarCursos();
        this.prepararNuevoCurso();
        const modalEl = document.getElementById('cursoModal');
        if (modalEl) (window as any).bootstrap?.Modal.getInstance(modalEl)?.hide();
      },
      error: () => alert('No se pudo crear el curso')
    });
  }

  eliminarInscripcion(id: number): void {
    if (!confirm('Eliminar trabajador del curso?')) return;
    this.trabajadoresCursosService.eliminarInscripcion(id).subscribe(() => {
      this.cargarInscripciones();
    });
  }

  eliminarCursoPassword(curso: Curso) {
    const pwd = prompt('Ingresa tu contraseña para eliminar el curso');
    if (!pwd) return;
    this.cursosService.eliminarCursoConPassword(curso.id_curso, pwd).subscribe({
      next: () => {
        this.cargarCursos();
        const modalEl = document.getElementById('detalleModal');
        if (modalEl) (window as any).bootstrap?.Modal.getInstance(modalEl)?.hide();
      },
      error: () => alert('No se pudo eliminar el curso')
    });
  }
}