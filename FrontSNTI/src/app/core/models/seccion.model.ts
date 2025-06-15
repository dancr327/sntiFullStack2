export interface Seccion {
    numero_seccion: number;
    estado: string; // si usas enum también cámbialo a ese tipo
    ubicacion: string;
    secretario?: string;
}
