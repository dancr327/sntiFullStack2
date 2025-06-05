// routes/permisosRoutes.js
const express = require("express");
const router = express.Router();
const { param } = require('express-validator');
const {
    validarPermiso,
    crearPermiso,
    listarPermisos,
    obtenerPermisosPorTrabajador,
    consultarMiPermiso,
    actualizarPermiso,
    eliminarPermiso,
    descargarDocumentoPermiso
} = require("../controllers/permisosController");
const { uploadAprobacionPermiso } = require("../config/multerPermisos");
const { verifyToken } = require("../middleware/auth");
const { hasRole } = require("../middleware/authorization");
const Roles = require('../enums/roles.enum');

/**
 * @swagger
 * tags:
 * - name: Permisos
 *   description: Gestión de permisos de trabajadores y documentos asociados
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PermisoInput:
 *       type: object
 *       required:
 *         - id_trabajador
 *         - fecha_inicio
 *         - fecha_fin
 *         - motivo
 *       properties:
 *         id_trabajador:
 *           type: integer
 *           example: 1
 *         tipo_permiso:
 *           type: string
 *           maxLength: 20
 *           example: "Vacaciones"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2024-06-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2024-06-15"
 *         motivo:
 *           type: string
 *           example: "Viaje familiar"
 *         estatus:
 *           type: string
 *           maxLength: 20
 *           example: "Aprobado"
 * 
 *     PermisoUpdateInput:
 *       type: object
 *       properties:
 *         id_trabajador:
 *           type: integer
 *           example: 1
 *         tipo_permiso:
 *           type: string
 *           example: "Permiso por Enfermedad"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2024-07-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2024-07-03"
 *         motivo:
 *           type: string
 *           example: "Cita médica"
 *         estatus:
 *           type: string
 *           example: "Aprobado"
 * 
 *     PermisoOutput:
 *       type: object
 *       properties:
 *         id_permiso:
 *           type: integer
 *           readOnly: true
 *           example: 1
 *         id_trabajador:
 *           type: integer
 *           example: 1
 *         tipo_permiso:
 *           type: string
 *           example: "Vacaciones"
 *         fecha_inicio:
 *           type: string
 *           format: date
 *           example: "2024-06-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           example: "2024-06-15"
 *         motivo:
 *           type: string
 *           example: "Viaje familiar"
 *         estatus:
 *           type: string
 *           example: "Aprobado"
 *         documento_aprobacion_id:
 *           type: integer
 *           example: 101
 *         fecha_registro:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         trabajadores:
 *           type: object
 *           properties:
 *             nombre: 
 *               type: string
 *               example: "Juan"
 *             apellido_paterno: 
 *               type: string
 *               example: "Pérez"
 *             apellido_materno: 
 *               type: string
 *               example: "Gómez"
 *             identificador: 
 *               type: string
 *               example: "juan.perez"
 *         documentos:
 *           type: object
 *           properties:
 *             id_documento: 
 *               type: integer
 *               example: 101
 *             nombre_archivo: 
 *               type: string
 *               example: "aprobacion.pdf"
 *             ruta_almacenamiento: 
 *               type: string
 *               example: "uploads/aprobaciones/1717000000000-file.pdf"
 *             tipo_documento: 
 *               type: string
 *               example: "Aprobación"
 *             fecha_subida: 
 *               type: string
 *               format: date-time
 * 
 *   responses:
 *     400Error:
 *       description: Error de validación
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success: 
 *                 type: boolean
 *                 example: false
 *               message: 
 *                 type: string
 *                 example: "Error de validación"
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     msg: 
 *                       type: string
 *                     param: 
 *                       type: string
 *                     location: 
 *                       type: string
 *     401Error:
 *       description: No autorizado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success: 
 *                 type: boolean
 *                 example: false
 *               message: 
 *                 type: string
 *                 example: "Acceso no autorizado"
 *     403Error:
 *       description: Prohibido
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success: 
 *                 type: boolean
 *                 example: false
 *               message: 
 *                 type: string
 *                 example: "Acceso denegado"
 *     404Error:
 *       description: No encontrado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success: 
 *                 type: boolean
 *                 example: false
 *               message: 
 *                 type: string
 *                 example: "Recurso no encontrado"
 *     500Error:
 *       description: Error del servidor
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success: 
 *                 type: boolean
 *                 example: false
 *               message: 
 *                 type: string
 *                 example: "Error interno"
 *               error: 
 *                 type: string
 */

// --- Rutas para Permisos ---

/**
 * @swagger
 * /permisos:
 *   post:
 *     summary: Crea un nuevo permiso con documento
 *     description: Accesible solo para ADMINISTRADORES
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id_trabajador
 *               - fecha_inicio
 *               - fecha_fin
 *               - motivo
 *               - documento
 *             properties:
 *               id_trabajador:
 *                 type: integer
 *                 example: 1
 *               tipo_permiso:
 *                 type: string
 *                 example: "Vacaciones"
 *               fecha_inicio:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-01"
 *               fecha_fin:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-15"
 *               motivo:
 *                 type: string
 *                 example: "Viaje familiar"
 *               estatus:
 *                 type: string
 *                 example: "Aprobado"
 *               documento:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Permiso creado con documento
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
 *                 data:
 *                   $ref: '#/components/schemas/PermisoOutput'
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
router.post(
    "/",
    verifyToken,
    hasRole([Roles.ADMINISTRADOR]),
    uploadAprobacionPermiso.single('documento'),
    validarPermiso,
    crearPermiso
);

/**
 * @swagger
 * /permisos:
 *   get:
 *     summary: Lista todos los permisos
 *     description: Accesible solo para ADMINISTRADORES
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PermisoOutput'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       403:
 *         $ref: '#/components/responses/403Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.get(
    "/",
    verifyToken,
    hasRole([Roles.ADMINISTRADOR]),
    listarPermisos
);

/**
 * @swagger
 * /permisos/trabajador/{idTrabajador}:
 *   get:
 *     summary: Obtiene permisos por trabajador
 *     description: Accesible solo para ADMINISTRADORES
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idTrabajador
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del trabajador
 *     responses:
 *       200:
 *         description: Permisos del trabajador
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PermisoOutput'
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
    "/trabajador/:idTrabajador",
    verifyToken,
    hasRole([Roles.ADMINISTRADOR]),
    [
        param('idTrabajador')
            .isInt().withMessage('ID debe ser entero')
            .toInt()
    ],
    obtenerPermisosPorTrabajador
);

/**
 * @swagger
 * /permisos/mi-permiso:
 *   get:
 *     summary: Obtiene mis permisos
 *     description: Accesible para ADMINISTRADORES y USUARIOS
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permisos del usuario
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PermisoOutput'
 *       401:
 *         $ref: '#/components/responses/401Error'
 *       500:
 *         $ref: '#/components/responses/500Error'
 */
router.get(
    "/mi-permiso",
    verifyToken,
    hasRole([Roles.ADMINISTRADOR, Roles.USUARIO]),
    consultarMiPermiso
);


/**
 * @swagger
 * /permisos/{id}:
 *   delete:
 *     summary: Elimina un permiso
 *     description: Accesible solo para ADMINISTRADORES
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del permiso
 *     responses:
 *       200:
 *         description: Permiso eliminado
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
    "/:id",
    verifyToken,
    hasRole([Roles.ADMINISTRADOR]),
    [
        param('id')
            .isInt().withMessage('ID debe ser entero')
            .toInt()
    ],
    eliminarPermiso
);

/**
 * @swagger
 * /permisos/documento/{documentoId}/descargar:
 *   get:
 *     summary: Descarga un documento de permiso
 *     description: Accesible para ADMINISTRADORES y USUARIOS (solo propietario)
 *     tags: [Permisos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentoId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del documento
 *     responses:
 *       200:
 *         description: Documento descargado
 *         content:
 *           application/pdf: {}
 *           image/jpeg: {}
 *           image/png: {}
 *           image/webp: {}
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
    "/documento/:documentoId/descargar",
    verifyToken,
    hasRole([Roles.ADMINISTRADOR, Roles.USUARIO]),
    [
        param('documentoId')
            .isInt().withMessage('ID debe ser entero')
            .toInt()
    ],
    descargarDocumentoPermiso
);

module.exports = router;