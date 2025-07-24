import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrabajadoresCursosService } from '../../../core/services/trabajadores-cursos.service';
import { TrabajadorCurso } from '../../../core/models/trabajador-curso.model';

@Component({
  selector: 'app-usercursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usercursos.component.html',
  styleUrl: './usercursos.component.css'
})
export class UsercursosComponent implements OnInit {
  inscripciones: TrabajadorCurso[] = [];

  constructor(private trabajadoresCursosService: TrabajadoresCursosService) {}

  ngOnInit(): void {
    this.trabajadoresCursosService.misInscripciones().subscribe({
      next: resp => this.inscripciones = resp.data || [],
      error: () => this.inscripciones = []
    });
  }
}
