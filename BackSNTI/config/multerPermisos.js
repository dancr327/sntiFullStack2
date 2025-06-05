// config/multerPermisos.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { createFileFilter } = require('../middleware/multer-error-handler'); // Asegúrate de que esta ruta sea correcta

// Directorio de subida específico para aprobaciones de permisos
const APROBACION_PERMISO_UPLOAD_DIR = path.join(__dirname, '../uploads', 'aprobaciones_permisos');

// Asegurar que el directorio exista
if (!fs.existsSync(APROBACION_PERMISO_UPLOAD_DIR)) {
    fs.mkdirSync(APROBACION_PERMISO_UPLOAD_DIR, { recursive: true });
}

// Lista de MIME types permitidos para documentos de aprobación de permisos
const APROBACION_PERMISO_ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
];

// Crear filtro de archivos específico para aprobaciones de permisos
const aprobacionPermisoFileFilter = createFileFilter(
    APROBACION_PERMISO_ALLOWED_MIME_TYPES,
    'Tipo de archivo no permitido para aprobación de permiso. Formatos aceptados: PDF, JPEG, PNG, WEBP.'
);

// Configuración de almacenamiento para aprobaciones de permisos
const storageAprobacionPermiso = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, APROBACION_PERMISO_UPLOAD_DIR);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
        const fileExtension = path.extname(file.originalname).toLowerCase();
        // Generar un nombre de archivo seguro y único
        const safeFilename = uniqueSuffix + fileExtension;
        cb(null, safeFilename);
    }
});

// Configuración final de multer para la subida de aprobaciones de permisos
const uploadAprobacionPermiso = multer({
    storage: storageAprobacionPermiso,
    fileFilter: aprobacionPermisoFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo por documento de permiso
    }
});

module.exports = {
    uploadAprobacionPermiso,
    APROBACION_PERMISO_UPLOAD_DIR // Exportamos la ruta para usarla en el controlador
};