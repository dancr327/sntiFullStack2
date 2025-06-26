const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const { verifyToken, multerHandler } = require('../middleware');
const { uploadPanelDocumento } = require('../config/multerPanel');
const { check, validationResult } = require('express-validator');
const TipoDocumento = require('../enums/tipodocumento.enum');

// ...existing code...
const { hasRole } = require('../middleware/authorization');
const Roles = require('../enums/roles.enum'); // <-- Agregado


const TIPOS_PANEL = [
  TipoDocumento.CURP,
  TipoDocumento.RFC,
  TipoDocumento.INE,
  TipoDocumento.CERTIFICADO_ESTUDIO,
  TipoDocumento.OTRO_DOCUMENTO,
];

/**
 * @swagger
 * tags:
 *   - name: Documentos
 *     description: Gestión de documentos del usuario (panel personal)
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Validación Express
const validateDocumentoPanel = [
  check('id_trabajador').isInt({ min: 1 }).toInt().withMessage('ID inválido'),
  check('tipo_documento').custom((value) => {
    if (!Object.values(TipoDocumento).includes(value)) {
      throw new Error('Tipo de documento inválido');
    }
    if (!TIPOS_PANEL.includes(value)) {
      throw new Error('Tipo no permitido en el panel');
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    next();
  },
];

/**
 * @swagger
 * /documentos/subir:
 *   post:
 *     summary: Subir documento personal del panel
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               id_trabajador:
 *                 type: integer
 *                 example: 101
 *               tipo_documento:
 *                 type: string
 *                 enum: [CURP, RFC, INE, CERTIFICADO_ESTUDIO, OTRO_DOCUMENTO]
 *               descripcion:
 *                 type: string
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 *       400:
 *         description: Datos inválidos o tipo no permitido
 *       409:
 *         description: Ya existe documento de este tipo
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/subir',
  verifyToken,
  hasRole([Roles.USUARIO]),
  multerHandler.handleMulterUpload(uploadPanelDocumento.single('archivo')),
  validateDocumentoPanel,
  documentoController.subirDocumento
);

// Ruta para descargar documento
// Declarar antes de las rutas con parámetros genéricos para evitar conflictos
router.get(
  '/descargar/:id_documento',
  (req, res, next) => {
    console.log('💥 Middleware: llegó petición de descarga');
    next();
  },
  verifyToken,
  hasRole([Roles.USUARIO]),
  documentoController.descargarDocumento
);

/**
 * @swagger
 * /documentos/descargar/{id_documento}:
 *   get:
 *     summary: Descargar documento por ID
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_documento
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Descarga exitosa
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error interno
 */

/**
 * @swagger
 * /documentos/{id_trabajador}/{tipo_documento}:
 *   get:
 *     summary: Obtener documento por tipo
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_trabajador
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: tipo_documento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CURP, RFC, INE, CERTIFICADO_ESTUDIO, OTRO_DOCUMENTO]
 *     responses:
 *       200:
 *         description: Documento encontrado
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error interno
 */

router.get(
  '/:id_trabajador/:tipo_documento',
  verifyToken,
  hasRole([Roles.USUARIO]),
  documentoController.obtenerDocumentoPorTipo
);

/**
 * @swagger
 * /documentos/{id_trabajador}/{tipo_documento}:
 *   delete:
 *     summary: Eliminar documento por tipo
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_trabajador
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: tipo_documento
 *         required: true
 *         schema:
 *           type: string
 *           enum: [CURP, RFC, INE, CERTIFICADO_ESTUDIO, OTRO_DOCUMENTO]
 *     responses:
 *       200:
 *         description: Documento eliminado
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error interno
 */
router.delete(
  '/:id_trabajador/:tipo_documento',
  verifyToken,
  hasRole([Roles.USUARIO]),
  documentoController.eliminarDocumentoPorTipo
);


module.exports = router;