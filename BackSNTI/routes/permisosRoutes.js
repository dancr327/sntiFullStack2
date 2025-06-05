// routes/permisosRoutes.js
const express = require('express');
const router = express.Router();
const { check, param } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { hasRole } = require('../middleware/authorization');
const Roles = require('../enums/roles.enum');
const permisosController = require('../controllers/permisosController');

/**
 * @swagger
 * tags:
 *   - name: Permisos
 *     description: Gestión de solicitudes y aprobaciones de permisos para trabajadores.
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Permiso:
 *       type: object
 *       properties:
 *         id_permiso:
 *           type: integer
 *           readOnly: true
 *           description: ID único del permiso.
 *           example: 1
 *         id_trabajador:
 *           type: integer
 *           description: ID del trabajador al que se le concede el permiso.
 *           example: 123
 *         tipo_permiso:
 *           type: string
 *           description: Tipo de permiso (ej. "Vacaciones", "Enfermedad", "Asuntos Personales").
 *           example: "Vacaciones"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           description: Fecha de inicio del permiso (YYYY-MM-DD).
 *           example: "2024-07-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           description: Fecha de fin del permiso (YYYY-MM-DD).
 *           example: "2024-07-15"
 *         motivo:
 *           type: string
 *           description: Motivo o razón del permiso.
 *           example: "Descanso anual"
 *         estatus:
 *           type: string
 *           enum: [Pendiente, Aprobado, Denegado, NoSolicitado]
 *           default: Pendiente
 *           description: Estatus actual del permiso.
 *           example: "Aprobado"
 *         documento_aprobacion_id:
 *           type: integer
 *           nullable: true
 *           description: ID del documento de aprobación/denegación asociado.
 *           example: 45
 *         documento_url:
 *           type: string
 *           nullable: true
 *           description: URL para descargar o ver el documento de aprobación/denegación.
 *           example: "http://localhost:3000/uploads/aprobaciones_permisos/16789012345-abcde.pdf"
 *         fecha_registro:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *           description: Fecha y hora de registro del permiso.
 *           example: "2024-06-01T10:00:00Z"
 *         trabajadores:
 *           type: object
 *           properties:
 *             id_trabajador:
 *               type: integer
 *             nombre:
 *               type: string
 *             apellido_paterno:
 *               type: string
 *             apellido_materno:
 *               type: string
 *           description: Datos básicos del trabajador asociado.
 *         documentos:
 *           type: object
 *           properties:
 *             id_documento:
 *               type: integer
 *             nombre_archivo:
 *               type: string
 *             ruta_archivo:
 *               type: string
 *             mime_type:
 *               type: string
 *           description: Información del documento asociado al permiso.
 * 
 *     PermisoInput:
 *       type: object
 *       required:
 *         - id_trabajador
 *         - tipo_permiso
 *         - fecha_inicio
 *         - fecha_fin
 *         - motivo
 *       properties:
 *         id_trabajador:
 *           type: integer
 *           description: ID del trabajador que solicita el permiso.
 *           example: 123
 *         tipo_permiso:
 *           type: string
 *           description: Tipo de permiso.
 *           example: "Vacaciones"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           description: Fecha de inicio del permiso (YYYY-MM-DD).
 *           example: "2024-08-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           description: Fecha de fin del permiso (YYYY-MM-DD).
 *           example: "2024-08-10"
 *         motivo:
 *           type: string
 *           description: Motivo detallado del permiso.
 *           example: "Viaje familiar"
 *         estatus:
 *           type: string
 *           enum: [Pendiente, Aprobado, Denegado]
 *           default: Pendiente
 *           description: Estatus inicial del permiso (solo para ADMINISTRADOR).
 *           example: "Pendiente"
 *         documento_aprobacion:
 *           type: string
 *           format: binary
 *           description: Archivo de aprobación/denegación (PDF/Imagen) a subir.
 * 
 *     PermisoUpdate:
 *       type: object
 *       properties:
 *         tipo_permiso:
 *           type: string
 *           description: Nuevo tipo de permiso.
 *           example: "Licencia Médica"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           description: Nueva fecha de inicio del permiso (YYYY-MM-DD).
 *           example: "2024-09-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           description: Nueva fecha de fin del permiso (YYYY-MM-DD).
 *           example: "2024-09-05"
 *         motivo:
 *           type: string
 *           description: Nuevo motivo del permiso.
 *           example: "Consulta médica"
 *         estatus:
 *           type: string
 *           enum: [Pendiente, Aprobado, Denegado]
 *           description: Nuevo estatus del permiso (solo para ADMINISTRADOR).
 *           example: "Aprobado"
 *         documento_aprobacion:
 *           type: string
 *           format: binary
 *           description: Nuevo archivo de aprobación/denegación (PDF/Imagen) a subir.
 *         eliminar_documento:
 *           type: boolean
 *           description: Establecer a `true` para eliminar el documento existente asociado al permiso.
 *           example: false
 * 
 *   responses:
 *     400Error:
 *       description: Error de validación o solicitud inválida.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *     401Error:
 *       description: No autorizado (token JWT no proporcionado o inválido).
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *     403Error:
 *       description: Prohibido - Rol no permitido.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *     404Error:
 *       description: Recurso no encontrado.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *     500Error:
 *       description: Error interno del servidor.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /permisos:
 *   get:
 *     summary: Obtiene todos los permisos registrados en el sistema.
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permiso'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.get(
  '/permisos',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  permisosController.getAllPermisos
);

/**
 * @swagger
 * /permisos/mis-permisos:
 *   get:
 *     summary: Obtiene todos los permisos asociados al trabajador autenticado.
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos del trabajador obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permiso'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.get(
  '/permisos/mis-permisos',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR, Roles.USUARIO]),
  permisosController.getMyPermisos
);

/**
 * @swagger
 * /permisos:
 *   post:
 *     summary: Crea un nuevo permiso para un trabajador.
 *     description: Solo accesible para el rol ADMINISTRADOR. Permite adjuntar un documento de aprobación/denegación.
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PermisoInput'
 *     responses:
 *       201:
 *         description: Permiso creado exitosamente.
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
 *                   example: "Permiso creado exitosamente."
 *                 permiso:
 *                   $ref: '#/components/schemas/Permiso'
 *       400:
 *         $ref: '#/components/responses/400Error'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       413:
 *         description: Archivo demasiado grande (LIMIT_FILE_SIZE de Multer).
 *       415:
 *         description: Tipo de archivo no permitido (UNSUPPORTED_MEDIA_TYPE de Multer).
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.post(
  '/permisos',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [
    check('id_trabajador').isInt().withMessage('El ID del trabajador debe ser un número entero.'),
    check('tipo_permiso').notEmpty().withMessage('El tipo de permiso es requerido.'),
    check('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida (YYYY-MM-DD).'),
    check('fecha_fin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida (YYYY-MM-DD).'),
    check('motivo').notEmpty().withMessage('El motivo del permiso es requerido.'),
    check('estatus')
      .optional()
      .isIn(['Pendiente', 'Aprobado', 'Denegado'])
      .withMessage('El estatus del permiso debe ser Pendiente, Aprobado o Denegado.'),
  ],
  permisosController.createPermiso
);

/**
 * @swagger
 * /permisos/{id}:
 *   put:
 *     summary: Actualiza un permiso existente.
 *     description: Solo accesible para el rol ADMINISTRADOR. Permite actualizar detalles del permiso, su estatus, y/o adjuntar/reemplazar/eliminar el documento de aprobación.
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PermisoUpdate'
 *     responses:
 *       200:
 *         description: Permiso actualizado exitosamente.
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
 *                   example: "Permiso actualizado exitosamente."
 *                 permiso:
 *                   $ref: '#/components/schemas/Permiso'
 *       400:
 *         $ref: '#/components/responses/400Error'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       404:
 *         $ref: '#/components/responses/404Error'
 *       413:
 *         description: Archivo demasiado grande (LIMIT_FILE_SIZE de Multer).
 *       415:
 *         description: Tipo de archivo no permitido (UNSUPPORTED_MEDIA_TYPE de Multer).
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.put(
  '/permisos/:id',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [
    param('id').isInt().withMessage('El ID del permiso debe ser un número entero válido.'),
    check('tipo_permiso').optional().notEmpty().withMessage('El tipo de permiso no puede estar vacío.'),
    check('fecha_inicio').optional().isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida (YYYY-MM-DD).'),
    check('fecha_fin').optional().isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida (YYYY-MM-DD).'),
    check('motivo').optional().notEmpty().withMessage('El motivo del permiso no puede estar vacío.'),
    check('estatus')
      .optional()
      .isIn(['Pendiente', 'Aprobado', 'Denegado'])
      .withMessage('El estatus del permiso debe ser Pendiente, Aprobado o Denegado.'),
    check('eliminar_documento')
      .optional()
      .isBoolean()
      .withMessage('El campo eliminar_documento debe ser un valor booleano (true/false).'),
  ],
  permisosController.updatePermiso
);

/**
 * @swagger
 * /permisos/{id}:
 *   delete:
 *     summary: Elimina un permiso existente.
 *     description: Solo accesible para el rol ADMINISTRADOR. También eliminará cualquier documento de aprobación asociado.
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del permiso a eliminar.
 *     responses:
 *       200:
 *         description: Permiso eliminado exitosamente.
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
 *                   example: "Permiso eliminado exitosamente."
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       404:
 *         $ref: '#/components/responses/404Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.delete(
  '/permisos/:id',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [
    param('id').isInt().withMessage('El ID del permiso debe ser un número entero válido.'),
  ],
  permisosController.deletePermiso
);

module.exports = router;