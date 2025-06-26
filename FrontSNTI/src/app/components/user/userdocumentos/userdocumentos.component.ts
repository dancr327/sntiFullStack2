import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentosService } from '../../../core/services/documentos.service';
import { Documento } from '../../../core/models/documento.model';

@Component({
  selector: 'app-userdocumentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './userdocumentos.component.html',
  styleUrl: './userdocumentos.component.css'
})
export class UserdocumentosComponent implements OnInit {
  tipos = ['CURP', 'RFC', 'INE', 'CERTIFICADO_ESTUDIO', 'OTRO_DOCUMENTO'];
  documentos: Documento[] = [];

  selectedTipo: string = '';
  descripcion = '';
  archivo: File | null = null;

  constructor(private documentosService: DocumentosService) {}

  ngOnInit(): void {
    this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.documentos = [];
    this.tipos.forEach(tipo => {
      this.documentosService.obtenerDocumentoPorTipo(tipo).subscribe({
        next: resp => {
          if (resp.success && resp.data) {
            this.documentos.push(resp.data);
          }
        },
        error: () => {}
      });
    });
  }

  onFileChange(event: any): void {
    this.archivo = event.target.files[0] || null;
  }

  subirDocumento(): void {
    if (!this.archivo || !this.selectedTipo) return;
    this.documentosService.subirDocumento({
      tipo_documento: this.selectedTipo,
      descripcion: this.descripcion,
      archivo: this.archivo
    }).subscribe({
      next: () => {
        this.resetForm();
        this.cargarDocumentos();
      },
      error: () => {
        alert('No se pudo subir el documento');
      }
    });
  }

  descargar(doc: Documento): void {
  this.documentosService.descargarDocumento(doc.id_documento).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.nombre_archivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
    error: () => alert('No se pudo descargar el documento')
    });
  }

  eliminar(doc: Documento): void {
    this.documentosService.eliminarDocumentoPorTipo(doc.tipo_documento).subscribe({
      next: () => this.cargarDocumentos(),
      error: () => alert('No se pudo eliminar el documento')
    });
  }

  resetForm(): void {
    this.selectedTipo = '';
    this.descripcion = '';
    this.archivo = null;
    const input = document.getElementById('archivo') as HTMLInputElement;
    if (input) input.value = '';
  }
}
