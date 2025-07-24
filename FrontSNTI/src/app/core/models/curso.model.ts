export interface Curso {
  id_curso: number;
  codigo_curso: string;
  nombre_curso: string;
  horas_duracion: number;
  estatus?: string;
  documento_constancia_id?: number;
  tipo_documento_curso?: string;
  documentoConstancia?: import('./documento.model').Documento;
}