//file: routes/documentoRoutes.js
const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const { verifyToken, multerHandler, authorizationMiddleware  } = require('../middleware');
const { uploadDocumento, MAPEO_TIPOS_DOCUMENTOS } = require('../config/multerConfig');
const { check, validationResult } = require('express-validator');
const { hasRole } = require('../middleware/authorization');

/**
 * @swagger
 * components:
 *   schemas:
 *     Documento:
 *       type: object
 *       required:
 *         - id_trabajador
 *         - tipo_documento
 *         - archivo
 *       properties:
 *         id_trabajador:
 *           type: integer
 *           example: 123
 *           description: ID del trabajador asociado
 *         tipo_documento:
 *           type: string
 *           enum: ['Acta de Nacimiento', 'Certificado de Estudios', 'Certificado de Curso', 'INE', 'CURP', 'RFC', 'Aprobación Permiso', 'Respaldo Cambio Adscripción', 'Otro']
 *           example: 'Acta de Nacimiento'
 *         descripcion:
 *           type: string
 *           nullable: true
 *           example: 'Documento notarial certificado'
 *         es_publico:
 *           type: boolean
 *           default: false
 *         archivo:
 *           type: string
 *           format: binary
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Middleware para validación de campos
const validateDocumento = [
  check('id_trabajador', 'ID de trabajador inválido')
    .isInt({ min: 1 })
    .toInt(),
  check('tipo_documento', 'Tipo de documento requerido')
    .notEmpty()
    .isIn(Object.keys(MAPEO_TIPOS_DOCUMENTOS))
    .withMessage('Tipo de documento no válido'),
  check('descripcion', 'Descripción muy larga (máx. 255 caracteres)')
    .optional()
    .isString()
    .isLength({ max: 255 }),
  check('es_publico', 'Valor público inválido')
    .optional()
    .isBoolean()
    .toBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

/**
 * @swagger
 * /documentos/subir:
 *   post:
 *     summary: Subir un documento
 *     description: Permite a un usuario autenticado subir un documento y asociarlo a un trabajador
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id_trabajador
 *               - tipo_documento
 *               - archivo
 *             properties:
 *               id_trabajador:
 *                 type: integer
 *                 example: 123
 *               tipo_documento:
 *                 type: string
 *                 enum: ['Acta de Nacimiento', 'Certificado de Estudios', 'Certificado de Curso', 'INE', 'CURP', 'RFC', 'Aprobación Permiso', 'Respaldo Cambio Adscripción', 'Otro']
 *               descripcion:
 *                 type: string
 *               es_publico:
 *                 type: boolean
 *               archivo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Documento subido y registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Documento subido exitosamente'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_documento:
 *                       type: integer
 *                       example: 123
 *                     nombre_archivo:
 *                       type: string
 *                       example: 'acta_nacimiento_123.pdf'
 *                     ruta_almacenamiento:
 *                       type: string
 *                       example: 'documentos/actas/acta_nacimiento_123.pdf'
 *                     tipo_documento:
 *                       type: string
 *                       example: 'Acta de Nacimiento'
 *       400:
 *         description: Error en la validación de datos
 *       401:
 *         description: No autorizado, token JWT requerido
 *       413:
 *         description: Archivo demasiado grande
 *       415:
 *         description: Tipo de archivo no soportado
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/subir',
  verifyToken,
  multerHandler.handleMulterUpload(uploadDocumento.single('archivo')),
  validateDocumento,
  documentoController.subirDocumento
);

/**
 * @swagger
 * /documentos/{id_trabajador}:
 *   get:
 *     summary: Obtener documentos de un trabajador
 *     description: Permite obtener la lista de documentos asociados a un trabajador
 *     tags: [Documentos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_trabajador
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del trabajador
 *     responses:
 *       200:
 *         description: Lista de documentos recuperada exitosamente
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Trabajador no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/:id_trabajador',
  verifyToken,
  [
    check('id_trabajador', 'ID de trabajador inválido')
      .isInt({ min: 1 })
      .toInt()
  ],
  documentoController.obtenerDocumentosPorTrabajador
);

/**
 * @swagger
 * /documentos/{id_documento}/descargar:
 *   get:
 *     summary: Descargar un documento
 *     description: Permite a los administradores descargar un documento específico.
 *     tags:
 *       - Documentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_documento
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del documento a descargar
 *     responses:
 *       200:
 *         description: Documento descargado exitosamente
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autorizado (solo administradores)
 *       404:
 *         description: Documento no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id_documento/descargar', verifyToken, documentoController.descargarDocumento);












module.exports = router;