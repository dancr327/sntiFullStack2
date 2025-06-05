export interface Usuario {
  id: number;
  identificador: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  rol: 'ADMINISTRADOR' | 'USUARIO';
  numero_empleado: string;
  puesto: string;
  seccion: {
    nombre_seccion: string;
    descripcion: string;
  };
  ultimo_login: string;
}