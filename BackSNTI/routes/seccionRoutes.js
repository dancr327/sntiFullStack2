// routes/seccionRoutes.js
const express = require('express');
const router = express.Router();
const { check, param } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { hasRole } = require('../middleware/authorization');
const Roles = require('../enums/roles.enum');
const seccionController = require('../controllers/seccionController');

/**
 * @swagger
 * tags:
 *   - name: Secciones
 *     description: Gestión de secciones para organizar trabajadores.
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
 *     Seccion:
 *       type: object
 *       properties:
 *         id_seccion:
 *           type: integer
 *           readOnly: true
 *           description: ID único de la sección.
 *           example: 1
 *         nombre_seccion:
 *           type: string
 *           description: Nombre único de la sección (ej. "CDMX Sindicato Principal #1").
 *           example: "CDMX Sindicato Principal #1"
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Descripción de la sección.
 *           example: "Sección principal del sindicato en la Ciudad de México."
 *       required:
 *         - nombre_seccion
 * 
 *     SeccionInput:
 *       type: object
 *       required:
 *         - nombre_seccion
 *       properties:
 *         nombre_seccion:
 *           type: string
 *           maxLength: 100
 *           description: Nombre único de la sección a crear.
 *           example: "Nueva Sección de Prueba"
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Descripción opcional de la nueva sección.
 *           example: "Descripción de la nueva sección."
 * 
 *     SeccionUpdate:
 *       type: object
 *       properties:
 *         nombre_seccion:
 *           type: string
 *           maxLength: 100
 *           description: Nuevo nombre opcional para la sección.
 *           example: "Sección Actualizada"
 *         descripcion:
 *           type: string
 *           nullable: true
 *           description: Nueva descripción opcional para la sección.
 *           example: "Descripción actualizada de la sección."
 */

/**
 * @swagger
 * /secciones:
 *   post:
 *     summary: Crea una nueva sección.
 *     tags: [Secciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeccionInput'
 *     responses:
 *       201:
 *         description: Sección creada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seccion'
 *       400:
 *         description: Datos de entrada inválidos.
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR).
 *       409:
 *         description: Conflicto - Ya existe una sección con el mismo nombre.
 *       500:
 *         description: Error del servidor.
 */
router.post(
  '/',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [
    check('nombre_seccion')
      .notEmpty().withMessage('El nombre de la sección es requerido.')
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.')
      .trim().escape(),
    check('descripcion')
      .optional({ nullable: true })
      .isLength({ max: 255 }).withMessage('La descripción no debe exceder los 255 caracteres.')
      .trim().escape()
  ],
  seccionController.createSeccion
);

/**
 * @swagger
 * /secciones:
 *   get:
 *     summary: Obtiene una lista de todas las secciones.
 *     tags: [Secciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de secciones obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Seccion'
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR y USUARIO).
 *       500:
 *         description: Error del servidor.
 */
router.get(
  '/',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR, Roles.USUARIO]),
  seccionController.getAllSecciones
);

/**
 * @swagger
 * /secciones/{id}:
 *   get:
 *     summary: Obtener sección por ID.
 *     tags: [Secciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID único de la sección.
 *     responses:
 *       200:
 *         description: Sección obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seccion'
 *       400:
 *         description: ID de sección inválido.
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR y USUARIO).
 *       404:
 *         description: Sección no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get(
  '/:id',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR, Roles.USUARIO]),
  [param('id').isInt().withMessage('El ID de la sección debe ser un número entero válido.')],
  seccionController.getSeccionById
);

/**
 * @swagger
 * /secciones/nombre/{nombre}:
 *   get:
 *     summary: Obtener sección por nombre. (Considera usar GET /secciones/{id} para mayor robustez)
 *     tags: [Secciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: nombre
 *         schema:
 *           type: string
 *         required: true
 *         description: Nombre único de la sección.
 *     responses:
 *       200:
 *         description: Sección obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seccion'
 *       400:
 *         description: Nombre de sección inválido.
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR y USUARIO).
 *       404:
 *         description: Sección no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.get(
  '/nombre/:nombre',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR, Roles.USUARIO]),
  [
    param('nombre')
      .notEmpty().withMessage('El nombre de la sección es requerido.')
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.')
      .trim().escape()
  ],
  seccionController.getSeccionPorNombre
);

/**
 * @swagger
 * /secciones/{id}:
 *   patch:
 *     summary: Actualiza parcialmente una sección por su ID.
 *     tags: [Secciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID único de la sección a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SeccionUpdate'
 *     responses:
 *       200:
 *         description: Sección actualizada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Seccion'
 *       400:
 *         description: Datos de entrada inválidos o no hay datos para actualizar.
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR).
 *       404:
 *         description: Sección no encontrada.
 *       409:
 *         description: Conflicto - El nuevo nombre de sección ya está en uso.
 *       500:
 *         description: Error del servidor.
 */
router.patch(
  '/:id',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [
    param('id').isInt().withMessage('El ID de la sección debe ser un número entero válido.'),
    check('nombre_seccion')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.')
      .escape(),
    check('descripcion')
      .optional({ nullable: true })
      .isLength({ max: 255 }).withMessage('La descripción no debe exceder los 255 caracteres.')
      .trim().escape()
  ],
  seccionController.updateSeccion
);

/**
 * @swagger
 * /secciones/{id}:
 *   delete:
 *     summary: Elimina una sección por su ID.
 *     tags: [Secciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID único de la sección a eliminar.
 *     responses:
 *       200:
 *         description: Sección eliminada exitosamente.
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
 *                   example: "Sección eliminada exitosamente"
 *       400:
 *         description: ID de sección inválido o la sección tiene trabajadores asociados.
 *       401:
 *         description: No autorizado (token JWT no proporcionado o inválido).
 *       403:
 *         description: Prohibido - Rol no permitido (solo ADMINISTRADOR).
 *       404:
 *         description: Sección no encontrada.
 *       500:
 *         description: Error del servidor.
 */
router.delete(
  '/:id',
  verifyToken,
  hasRole([Roles.ADMINISTRADOR]),
  [param('id').isInt().withMessage('El ID de la sección debe ser un número entero válido.')],
  seccionController.deleteSeccion
);

module.exports = router;