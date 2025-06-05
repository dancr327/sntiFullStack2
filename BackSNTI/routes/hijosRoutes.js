const express = require('express');
const router = express.Router();
const { check, param } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { multerErrorHandler } = require('../middleware/multer-error-handler');
const hijosController = require('../controllers/hijosController');
const { authMiddleware, authorizationMiddleware } = require('../middleware');
const { uploadActaNacimiento, TIPOS_DOCUMENTOS } = require('../config/multerConfig');
const Roles = require('../enums/roles.enum');

// Asegurar que el directorio para actas de nacimiento exista
const actasDir = path.join(__dirname, '../uploads', TIPOS_DOCUMENTOS.ACTA_NACIMIENTO);
if (!fs.existsSync(actasDir)) {
  fs.mkdirSync(actasDir, { recursive: true });
}

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Hijo:
 *       type: object
 *       properties:
 *         id_hijo:
 *           type: integer
 *           description: Identificador único del hijo.
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre del hijo.
 *           example: "Juan"
 *         apellido_paterno:
 *           type: string
 *           description: Apellido paterno del hijo.
 *           example: "Pérez"
 *         apellido_materno:
 *           type: string
 *           description: Apellido materno del hijo.
 *           example: "Gómez"
 *         fecha_nacimiento:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento del hijo en formato YYYY-MM-DD.
 *           example: "2020-01-15"
 *         vigente:
 *           type: boolean
 *           description: Indica si el registro del hijo está activo.
 *           example: true
 *         id_trabajador:
 *           type: integer
 *           description: ID del trabajador al que pertenece el hijo.
 *           example: 101
 * 
 *     DocumentoHijo:
 *       type: object
 *       properties:
 *         id_documento:
 *           type: integer
 *           description: ID del documento (acta de nacimiento).
 *           example: 5
 *         nombre_archivo:
 *           type: string
 *           description: Nombre original del archivo.
 *           example: "acta_juan_perez.pdf"
 *         tipo_documento:
 *           type: string
 *           description: Tipo de documento.
 *           example: "ACTA_NACIMIENTO"
 *         fecha_subida:
 *           type: string
 *           format: date-time
 *           description: Fecha y hora de subida del documento.
 *           example: "2023-10-27T10:00:00.000Z"
 *         ruta_almacenamiento:
 *           type: string
 *           description: Ruta donde se almacena el archivo.
 *           example: "actas_nacimiento/unique-filename.pdf"
 *         mimetype:
 *           type: string
 *           description: Tipo MIME del archivo.
 *           example: "application/pdf"
 *         tamano_bytes:
 *           type: string
 *           description: Tamaño del archivo en bytes (como string para manejar BigInt).
 *           example: "102456"
 * 
 *     HijoWithDocumento:
 *       allOf:
 *         - $ref: '#/components/schemas/Hijo'
 *         - type: object
 *           properties:
 *             documentos:
 *               $ref: '#/components/schemas/DocumentoHijo'
 * 
 *     HijoResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Hijo y acta de nacimiento registrados exitosamente"
 *         data:
 *           type: object
 *           properties:
 *             hijo:
 *               $ref: '#/components/schemas/Hijo'
 *             documento:
 *               $ref: '#/components/schemas/DocumentoHijo'
 * 
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 * 
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error interno del servidor"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               msg:
 *                 type: string
 *                 example: "El nombre del hijo es obligatorio"
 *               param:
 *                 type: string
 *                 example: "nombre"
 *               location:
 *                 type: string
 *                 example: "body"
 *               error:
 *                 type: string
 *                 example: "Detalles técnicos del error"
 * 
 *   responses:
 *     400Error:
 *       description: Error de validación o solicitud inválida.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *     401Error:
 *       description: No autorizado - Token inválido o expirado.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *     403Error:
 *       description: Acceso denegado - El usuario no tiene el rol o permiso requerido.
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
 * /hijos:
 *   post:
 *     summary: Registrar un nuevo hijo y subir su acta de nacimiento (solo para USUARIO)
 *     description: Permite a un trabajador con rol 'USUARIO' registrar un nuevo hijo, incluyendo la subida de su acta de nacimiento. Automáticamente actualiza el contador 'numero_hijos' del trabajador.
 *     tags: [Hijos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido_paterno
 *               - apellido_materno
 *               - fecha_nacimiento
 *               - acta_nacimiento
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan"
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre del hijo
 *               apellido_paterno:
 *                 type: string
 *                 example: "Pérez"
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Apellido paterno
 *               apellido_materno:
 *                 type: string
 *                 example: "Gómez"
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Apellido materno
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 example: "2020-01-15"
 *                 description: Fecha de nacimiento (YYYY-MM-DD)
 *               acta_nacimiento:
 *                 type: string
 *                 format: binary
 *                 description: Archivo del acta de nacimiento (PDF, JPEG, PNG, WEBP)
 *     responses:
 *       201:
 *         description: Hijo y acta de nacimiento registrados exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HijoResponse'
 *       400:
 *         $ref: '#/components/responses/400Error'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.post(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.hasRole([Roles.USUARIO]),
  uploadActaNacimiento.single('acta_nacimiento'),
  multerErrorHandler,
  hijosController.validarHijo,
  hijosController.registrarHijo
);

/**
 * @swagger
 * /hijos/trabajador/{id_trabajador}:
 *   get:
 *     summary: Obtener la lista de hijos de un trabajador (solo para ADMINISTRADOR)
 *     description: Permite a un usuario con rol 'ADMINISTRADOR' obtener la lista de hijos de cualquier trabajador especificado por su ID.
 *     tags: [Hijos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_trabajador
 *         required: true
 *         schema:
 *           type: integer
 *           example: 101
 *         description: ID del trabajador del cual obtener los hijos.
 *     responses:
 *       200:
 *         description: Lista de hijos obtenida exitosamente.
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
 *                     $ref: '#/components/schemas/HijoWithDocumento'
 *       400:
 *         $ref: '#/components/responses/400Error'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       404:
 *         $ref: '#/components/responses/404Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.get(
  '/trabajador/:id_trabajador',
  authMiddleware.verifyToken,
  authorizationMiddleware.hasRole([Roles.ADMINISTRADOR]),
  param('id_trabajador').isInt().withMessage('ID del trabajador inválido'),
  hijosController.obtenerHijosPorTrabajador
);

/**
 * @swagger
 * /hijos:
 *   get:
 *     summary: Obtener los hijos del trabajador autenticado (solo para USUARIO)
 *     description: Permite a un trabajador con rol 'USUARIO' obtener la lista de sus propios hijos.
 *     tags: [Hijos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de hijos obtenida exitosamente.
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
 *                     $ref: '#/components/schemas/HijoWithDocumento'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       404:
 *         $ref: '#/components/responses/404Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.get(
  '/',
  authMiddleware.verifyToken,
  authorizationMiddleware.hasRole([Roles.USUARIO]),
  hijosController.obtenerHijosPorTrabajador
);

/**
 * @swagger
 * /hijos/{id_hijo}:
 *   put:
 *     summary: Actualizar información de un hijo (USUARIO y ADMINISTRADOR)
 *     description: |
 *       Permite a un usuario con rol 'USUARIO' actualizar sus propios hijos.
 *       Permite a un usuario con rol 'ADMINISTRADOR' actualizar cualquier hijo, pudiendo incluso reasignarlo a otro trabajador (incluyendo `id_trabajador` en el body).
 *       Si se proporciona un nuevo archivo `acta_nacimiento`, el documento anterior asociado será reemplazado.
 *       Automáticamente actualiza el contador 'numero_hijos' de los trabajadores afectados.
 *     tags: [Hijos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_hijo
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del hijo a actualizar.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nuevo nombre del hijo.
 *                 example: "Juan David"
 *               apellido_paterno:
 *                 type: string
 *                 description: Nuevo apellido paterno.
 *                 example: "González"
 *               apellido_materno:
 *                 type: string
 *                 description: Nuevo apellido materno.
 *                 example: "Martínez"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 description: Nueva fecha de nacimiento (YYYY-MM-DD).
 *                 example: "2019-05-20"
 *               vigente:
 *                 type: boolean
 *                 description: Estado de vigencia del hijo (true/false).
 *                 example: false
 *               id_trabajador:
 *                 type: integer
 *                 description: (Solo para ADMINISTRADORES) Nuevo ID del trabajador si se reasigna el hijo.
 *                 example: 102
 *               acta_nacimiento:
 *                 type: string
 *                 format: binary
 *                 description: Nuevo archivo del acta de nacimiento (PDF, JPEG, PNG, WEBP).
 *     responses:
 *       200:
 *         description: Hijo actualizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HijoResponse'
 *       400:
 *         $ref: '#/components/responses/400Error'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       404:
 *         $ref: '#/components/responses/404Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.put(
  '/:id_hijo',
  authMiddleware.verifyToken,
  authorizationMiddleware.hasRole([Roles.USUARIO, Roles.ADMINISTRADOR]),
  uploadActaNacimiento.single('acta_nacimiento'),
  multerErrorHandler,
  param('id_hijo').isInt().withMessage('ID del hijo inválido'),
  hijosController.actualizarHijo
);

/**
 * @swagger
 * /hijos/{id_hijo}:
 *   delete:
 *     summary: Marcar un hijo como no vigente (eliminación lógica, para USUARIO y ADMINISTRADOR)
 *     description: |
 *       Permite a un usuario con rol 'USUARIO' marcar sus propios hijos como no vigentes.
 *       Permite a un usuario con rol 'ADMINISTRADOR' marcar cualquier hijo como no vigente.
 *       Esta es una eliminación lógica, estableciendo el campo `vigente` a `false`.
 *       Automáticamente actualiza el contador 'numero_hijos' del trabajador afectado.
 *     tags: [Hijos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_hijo
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: ID del hijo a marcar como no vigente.
 *     responses:
 *       200:
 *         description: Hijo marcado como no vigente exitosamente (baja lógica). El contador de hijos del trabajador ha sido actualizado.
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
 *                   example: "Hijo marcado como no vigente exitosamente (eliminación lógica). El contador de hijos del trabajador ha sido actualizado."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id_hijo:
 *                       type: integer
 *                       example: 1
 *                     vigente:
 *                       type: boolean
 *                       example: false
 *       400:
 *         $ref: '#/components/responses/400Error'
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
  '/:id_hijo',
  authMiddleware.verifyToken,
  authorizationMiddleware.hasRole([Roles.USUARIO, Roles.ADMINISTRADOR]),
  param('id_hijo').isInt().withMessage('ID del hijo inválido'),
  hijosController.eliminarHijo
);

module.exports = router;