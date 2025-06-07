// core/models/trabajador.model.ts
export interface Trabajador {
  identificador: string;
  contraseña: string; // sólo para crear/actualizar
  rol?: 'ADMINISTRADOR' | 'USUARIO';
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento: string; // formato YYYY-MM-DD
  sexo: 'M' | 'F';
  curp: string;
  rfc: string;
  email: string;
  situacion_sentimental?: 'Soltero' | 'Casado' | 'Divorciado' | 'Viudo' | 'Union Libre';
  numero_hijos?: number;
  numero_empleado: string;
  numero_plaza: string;
  fecha_ingreso: string;
  fecha_ingreso_gobierno: string;
  nivel_puesto: string;
  nombre_puesto: string;
  puesto_inpi?: string;
  adscripcion: string;
  id_seccion: number;
  nivel_estudios?: string;
  institucion_estudios?: string;
  certificado_estudios?: boolean;
  plaza_base?: string;
}
