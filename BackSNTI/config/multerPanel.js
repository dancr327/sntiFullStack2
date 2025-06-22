const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { createFileFilter } = require('../middleware/multer-error-handler');

const PANEL_UPLOAD_BASE = path.join(__dirname, '../uploads');

// Directorios permitidos para tipos de documentos del panel
const PANEL_DIRECTORIES = {
  CURP: 'curp',
  RFC: 'rfc',
  INE: 'ine',
  CERTIFICADO_ESTUDIO: 'certificados_estudio',
  OTRO_DOCUMENTO: 'otros_documentos'
};

// Tipos MIME permitidos
const PANEL_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// Filtro general para documentos del panel
const panelFileFilter = createFileFilter(
  PANEL_ALLOWED_MIME_TYPES,
  'Tipo de archivo no permitido para documentos del panel.'
);

// Configuración de almacenamiento
const storagePanelDocumentos = multer.diskStorage({
  destination: function (req, file, cb) {
    const tipo = req.body.tipo_documento;
    const folder = PANEL_DIRECTORIES[tipo] || 'otros_documentos';
    const dir = path.join(PANEL_UPLOAD_BASE, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + extension);
  }
});

const uploadPanelDocumento = multer({
  storage: storagePanelDocumentos,
  fileFilter: panelFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

module.exports = {
  uploadPanelDocumento
};