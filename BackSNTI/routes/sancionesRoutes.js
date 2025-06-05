// routes/sancionesRoutes.js
const express = require('express');
const router = express.Router();
const { check, param } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { hasRole } = require('../middleware/authorization');
const Roles = require('../enums/roles.enum');
const sancionesController = require('../controllers/sancionesController');

/**
 * @swagger
 * tags:
 *   - name: Sanciones
 *     description: Gestión y consulta del historial de sanciones aplicadas a trabajadores.
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
 *     Sancion:
 *       type: object
 *       properties:
 *         id_sancion:
 *           type: integer
 *           readOnly: true
 *           description: ID único de la sanción.
 *           example: 1
 *         id_trabajador:
 *           type: integer
 *           description: ID del trabajador sancionado.
 *           example: 123
 *         tipo_sancion:
 *           type: string
 *           description: Tipo de sanción (ej. "Amonestación verbal", "Suspensión", "Despido").
 *           example: "Amonestación verbal"
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del motivo de la sanción.
 *           example: "Retrasos reiterados a la entrada laboral."
 *         fecha_aplicacion:
 *           type: string
 *           format: date
 *           description: Fecha en que se aplicó la sanción (YYYY-MM-DD).
 *           example: "2024-05-20"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Fecha en que termina la sanción, si aplica (YYYY-MM-DD).
 *           example: "2024-05-25"
 *         estatus:
 *           type: string
 *           default: "No"
 *           description: Estatus de la sanción (siempre "No", ya que es solo un registro histórico).
 *           example: "No"
 *         usuario_registro:
 *           type: string
 *           nullable: true
 *           readOnly: true
 *           description: Usuario que registró la sanción.
 *           example: "ADMIN_XYZ"
 *         fecha_registro:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *           description: Fecha y hora de registro de la sanción.
 *           example: "2024-05-20T10:30:00Z"
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
 *             numero_empleado:
 *               type: string
 *           description: Datos básicos del trabajador sancionado.
 * 
 *     SancionCrear:
 *       type: object
 *       required:
 *         - id_trabajador
 *         - tipo_sancion
 *         - descripcion
 *         - fecha_aplicacion
 *       properties:
 *         id_trabajador:
 *           type: integer
 *           description: ID del trabajador a sancionar.
 *           example: 123
 *         tipo_sancion:
 *           type: string
 *           description: Tipo de sanción.
 *           example: "Amonestación escrita"
 *         descripcion:
 *           type: string
 *           description: Motivo de la sanción.
 *           example: "Incumplimiento de horario."
 *         fecha_aplicacion:
 *           type: string
 *           format: date
 *           description: Fecha de aplicación de la sanción (YYYY-MM-DD).
 *           example: "2024-06-01"
 *         fecha_fin:
 *           type: string
 *           format: date
 *           nullable: true
 *           description: Fecha de fin de la sanción (YYYY-MM-DD), si aplica.
 *           example: "2024-06-05"
 */

/**
 * @swagger
 * /sanciones:
 *   get:
 *     summary: Obtiene una lista de todas las sanciones registradas.
 *     description: Solo accesible para el rol ADMINISTRADOR. Permite consultar el historial de sanciones de todos los trabajadores.
 *     tags: [Sanciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sanciones obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sancion'
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR).
 *       500:
 *         description: Error interno del servidor.
 */
router.get(
  '/sanciones',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  sancionesController.obtenerTodasLasSanciones
);

/**
 * @swagger
 * /sanciones/{id}:
 *   get:
 *     summary: Obtiene una sanción específica por su ID.
 *     description: Solo accesible para el rol ADMINISTRADOR.
 *     tags: [Sanciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la sanción a obtener.
 *     responses:
 *       200:
 *         description: Sanción obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 datos:
 *                   $ref: '#/components/schemas/Sancion'
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR).
 *       404:
 *         description: Sanción no encontrada.
 *       500:
 *         description: Error interno del servidor.
 */
router.get(
  '/sanciones/:id',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [
    param('id').isInt().withMessage('El ID de la sanción debe ser un número entero válido.'),
  ],
  sancionesController.obtenerSancionPorId
);

/**
 * @swagger
 * /sanciones/mis-sanciones:
 *   get:
 *     summary: Obtiene todas las sanciones asociadas al trabajador autenticado.
 *     description: Accesible para los roles ADMINISTRADOR y USUARIO. Los usuarios solo verán sus propias sanciones.
 *     tags: [Sanciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sanciones del trabajador obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 datos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sancion'
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido.
 *       500:
 *         description: Error interno del servidor.
 */
router.get(
  '/sanciones/mis-sanciones',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR, Roles.USUARIO]),
  sancionesController.obtenerMisSanciones
);

/**
 * @swagger
 * /sanciones:
 *   post:
 *     summary: Crea una nueva sanción para un trabajador.
 *     description: Solo accesible para el rol ADMINISTRADOR. Las sanciones creadas son inmutables y no pueden ser editadas o eliminadas posteriormente, sirviendo como registro histórico. El 'estatus' se establece automáticamente en "No".
 *     tags: [Sanciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SancionCrear'
 *     responses:
 *       201:
 *         description: Sanción creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 mensaje:
 *                   type: string
 *                   example: "Sanción creada exitosamente."
 *                 sancion:
 *                   $ref: '#/components/schemas/Sancion'
 *       400:
 *         description: Datos de entrada inválidos o faltantes.
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR).
 *       404:
 *         description: Trabajador no encontrado (si el id_trabajador no existe).
 *       500:
 *         description: Error interno del servidor.
 */
router.post(
  '/sanciones',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [
    check('id_trabajador').isInt().withMessage('El ID del trabajador debe ser un número entero.'),
    check('tipo_sancion')
      .notEmpty().withMessage('El tipo de sanción es requerido.')
      .isLength({ max: 50 }).withMessage('El tipo de sanción no debe exceder 50 caracteres.'),
    check('descripcion').notEmpty().withMessage('La descripción es requerida.'),
    check('fecha_aplicacion').isISO8601().toDate().withMessage('La fecha de aplicación debe ser una fecha válida (YYYY-MM-DD).'),
    check('fecha_fin').optional({ nullable: true }).isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida (YYYY-MM-DD).'),
  ],
  sancionesController.crearSancion
);

module.exports = router;