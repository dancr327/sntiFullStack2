export interface Sancion {
  id_sancion: number;
  id_trabajador: number;
  tipo_sancion: string;
  descripcion: string;
  fecha_aplicacion: string;
  fecha_fin: string | null;
  estatus: string | null;
  usuario_registro?: string;
  fecha_registro?: string;
  trabajadores: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    identificador: string;
  };
}