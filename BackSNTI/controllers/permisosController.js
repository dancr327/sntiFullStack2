// controllers/permisosController.js
const { PrismaClient } = require('@prisma/client');
const { body, param, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises; // Usamos fs.promises para operaciones asíncronas
const crypto = require('crypto'); // Para generar el hash del archivo
const prisma = new PrismaClient();
const Roles = require('../enums/roles.enum'); // Asegúrate de que la ruta sea correcta
const { APROBACION_PERMISO_UPLOAD_DIR } = require('../config/multerPermisos'); // Importar la ruta de subida
const { stat } = require('fs').promises; // Importa 'stat' desde fs.promises

// --- Middleware para validar datos de entrada de un permiso ---
const validarPermiso = [
    body('id_trabajador')
        .notEmpty().withMessage('El ID del trabajador es obligatorio.')
        .isInt().withMessage('El ID del trabajador debe ser un número entero.'),
    body('tipo_permiso')
        .optional()
        .isLength({ max: 20 }).withMessage('El tipo de permiso no puede exceder 20 caracteres.'),
    body('fecha_inicio')
        .notEmpty().withMessage('La fecha de inicio es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de inicio inválido (YYYY-MM-DD).'),
    body('fecha_fin')
        .notEmpty().withMessage('La fecha de fin es obligatoria.')
        .isISO8601().withMessage('Formato de fecha de fin inválido (YYYY-MM-DD).')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.body.fecha_inicio)) {
                throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
            }
            return true;
        }),
    body('motivo')
        .notEmpty().withMessage('El motivo del permiso es obligatorio.'),
    body('estatus')
        .optional()
        .isLength({ max: 20 }).withMessage('El estatus no puede exceder 20 caracteres.'),
    // Nota: El documento_aprobacion_id se maneja en el controlador después de la subida del archivo
];

/**
 * @function crearPermiso
 * @description Crea un nuevo permiso para un trabajador, incluyendo la subida de un documento de aprobación. Solo accesible para ADMINISTRADORES.
 * @param {object} req - Objeto de solicitud de Express (req.body, req.file).
 * @param {object} res - Objeto de respuesta de Express.
 */
const crearPermiso = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Si hay errores de validación de campos, elimina el archivo subido si existe
            if (req.file) {
                await fs.unlink(req.file.path);
            }
            return res.status(400).json({ success: false, message: 'Error de validación', errors: errors.array() });
        }

        const {
            id_trabajador,
            tipo_permiso,
            fecha_inicio,
            fecha_fin,
            motivo,
            estatus
        } = req.body;

        // Validar si se subió un archivo (es obligatorio para el documento de aprobación)
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'El documento de aprobación es obligatorio.' });
        }

        const filePath = req.file.path;
        const fileName = req.file.filename; // Nombre único generado por Multer
        const originalName = req.file.originalname;
        const fileSize = req.file.size;
        const mimetype = req.file.mimetype;

        // Verificar si el trabajador existe
        const trabajadorExistente = await prisma.trabajadores.findUnique({
            where: { id_trabajador: parseInt(id_trabajador) }
        });

        if (!trabajadorExistente) {
            await fs.unlink(filePath); // Elimina el archivo si el trabajador no existe
            return res.status(404).json({ success: false, message: 'El trabajador especificado no existe.' });
        }

        // Leer el archivo para calcular el hash
        const fileBuffer = await fs.readFile(filePath);
        const hash_archivo = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Registrar el documento en la tabla 'documentos'
        const nuevoDocumento = await prisma.documentos.create({
            data: {
                id_trabajador: parseInt(id_trabajador),
                tipo_documento: 'Aprobación Permiso', // Tipo fijo para este flujo
                nombre_archivo: originalName,
                descripcion: `Documento de aprobación para permiso de tipo "${tipo_permiso || 'N/A'}"`,
                hash_archivo: hash_archivo,
                ruta_almacenamiento: path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/'),
                tamano_bytes: fileSize,
                mimetype: mimetype,
                es_publico: false // Los documentos de aprobación no suelen ser públicos
            }
        });

        // Crear el permiso en la tabla 'permisos'
        const nuevoPermiso = await prisma.permisos.create({
            data: {
                id_trabajador: parseInt(id_trabajador),
                tipo_permiso: tipo_permiso || null,
                fecha_inicio: new Date(fecha_inicio),
                fecha_fin: new Date(fecha_fin),
                motivo,
                estatus: estatus || 'Pendiente', // Estatus por defecto
                documento_aprobacion_id: nuevoDocumento.id_documento, // Asociar el documento recién creado
                fecha_registro: new Date()
            }
        });

        // Omitir información sensible o muy detallada del documento en la respuesta final del permiso
        const { id_documento, ...documentoInfo } = nuevoDocumento;

        return res.status(201).json({
            success: true,
            message: 'Permiso y documento de aprobación registrados exitosamente.',
            data: {
                permiso: nuevoPermiso,
                documento: {
                    id_documento: nuevoDocumento.id_documento,
                    nombre_archivo: nuevoDocumento.nombre_archivo,
                    ruta: nuevoDocumento.ruta_almacenamiento
                }
            }
        });

    } catch (error) {
        console.error('Error al crear el permiso:', error);
        // Si hubo un error después de que Multer subiera el archivo, elimínalo
        if (req.file && await fs.access(req.file.path).then(() => true).catch(() => false)) {
            await fs.unlink(req.file.path);
        }
        return res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
    }
};

/**
 * @function listarPermisos
 * @description Lista todos los permisos registrados en el sistema. Solo accesible para ADMINISTRADORES.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
const listarPermisos = async (req, res) => {
    try {
        const permisos = await prisma.permisos.findMany({
            include: {
                trabajadores: {
                    select: {
                        nombre: true,
                        apellido_paterno: true,
                        apellido_materno: true,
                        identificador: true
                    }
                },
                documentos: { // Incluir información del documento asociado
                    select: {
                        id_documento: true,
                        nombre_archivo: true,
                        ruta_almacenamiento: true,
                        tipo_documento: true,
                        fecha_subida: true
                    }
                }
            },
            orderBy: {
                fecha_registro: 'desc' // Ordenar por fecha de registro descendente
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Lista de permisos obtenida exitosamente.',
            data: permisos
        });

    } catch (error) {
        console.error('Error al listar permisos:', error);
        return res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
    }
};

/**
 * @function obtenerPermisosPorTrabajador
 * @description Obtiene todos los permisos de un trabajador específico por su ID. Solo accesible para ADMINISTRADORES.
 * @param {object} req - Objeto de solicitud de Express (req.params.idTrabajador).
 * @param {object} res - Objeto de respuesta de Express.
 */
const obtenerPermisosPorTrabajador = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Error de validación', errors: errors.array() });
        }

        const idTrabajador = parseInt(req.params.idTrabajador);

        // Verificar si el trabajador existe
        const trabajadorExistente = await prisma.trabajadores.findUnique({
            where: { id_trabajador: idTrabajador }
        });

        if (!trabajadorExistente) {
            return res.status(404).json({ success: false, message: 'El trabajador especificado no existe.' });
        }

        const permisos = await prisma.permisos.findMany({
            where: {
                id_trabajador: idTrabajador
            },
            include: {
                trabajadores: {
                    select: {
                        nombre: true,
                        apellido_paterno: true,
                        apellido_materno: true,
                        identificador: true
                    }
                },
                documentos: {
                    select: {
                        id_documento: true,
                        nombre_archivo: true,
                        ruta_almacenamiento: true,
                        tipo_documento: true,
                        fecha_subida: true
                    }
                }
            },
            orderBy: {
                fecha_registro: 'desc'
            }
        });

        return res.status(200).json({
            success: true,
            message: `Permisos para el trabajador con ID ${idTrabajador} obtenidos exitosamente.`,
            data: permisos
        });

    } catch (error) {
        console.error('Error al obtener permisos por trabajador:', error);
        return res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
    }
};

/**
 * @function consultarMiPermiso
 * @description Permite al usuario autenticado consultar sus propios permisos. Accesible para ADMINISTRADORES y USUARIOS.
 * @param {object} req - Objeto de solicitud de Express (req.user.id).
 * @param {object} res - Objeto de respuesta de Express.
 */
const consultarMiPermiso = async (req, res) => {
    try {
        const userId = req.user.id; // El ID del usuario se adjunta desde verifyToken

        const permisos = await prisma.permisos.findMany({
            where: {
                id_trabajador: userId
            },
            include: {
                trabajadores: {
                    select: {
                        nombre: true,
                        apellido_paterno: true,
                        apellido_materno: true,
                        identificador: true
                    }
                },
                documentos: {
                    select: {
                        id_documento: true,
                        nombre_archivo: true,
                        ruta_almacenamiento: true,
                        tipo_documento: true,
                        fecha_subida: true
                    }
                }
            },
            orderBy: {
                fecha_registro: 'desc'
            }
        });

        if (permisos.length === 0) {
            return res.status(200).json({ success: true, message: 'No tienes permisos registrados.', data: [] });
        }

        return res.status(200).json({
            success: true,
            message: 'Tus permisos han sido obtenidos exitosamente.',
            data: permisos
        });

    } catch (error) {
        console.error('Error al obtener los permisos del usuario autenticado:', error);
        return res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
    }
};

/**
 * @function eliminarPermiso
 * @description Elimina un permiso por su ID, incluyendo el archivo de aprobación asociado. Solo accesible para ADMINISTRADORES.
 * @param {object} req - Objeto de solicitud de Express (req.params.id).
 * @param {object} res - Objeto de respuesta de Express.
 */
const eliminarPermiso = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Error de validación', errors: errors.array() });
        }

        const permisoId = parseInt(req.params.id);

        const permisoExistente = await prisma.permisos.findUnique({
            where: { id_permiso: permisoId },
            include: { documentos: true } // Incluir el documento para eliminar el archivo físico
        });

        if (!permisoExistente) {
            return res.status(404).json({
                success: false,
                message: 'Permiso no encontrado para eliminar.'
            });
        }

        // Eliminar el archivo físico si existe
        if (permisoExistente.documentos && permisoExistente.documentos.ruta_almacenamiento) {
            const filePathToDelete = path.join(__dirname, '..', permisoExistente.documentos.ruta_almacenamiento);
            try {
                await fs.unlink(filePathToDelete);
                console.log(`Archivo eliminado: ${filePathToDelete}`);
            } catch (unlinkError) {
                console.warn(`No se pudo eliminar el archivo ${filePathToDelete}:`, unlinkError.message);
                // Si el archivo no se pudo eliminar (ej. no existe), se ignora y se procede con la eliminación de la BD
            }
        }

        // Eliminar el registro del permiso
        await prisma.permisos.delete({
            where: { id_permiso: permisoId }
        });

        // Eliminar el registro del documento asociado (si existe y no se eliminó automáticamente por CASCADE)
        if (permisoExistente.documentos) {
            try {
                await prisma.documentos.delete({
                    where: { id_documento: permisoExistente.documentos.id_documento }
                });
            } catch (dbDeleteError) {
                console.warn(`No se pudo eliminar el registro del documento ${permisoExistente.documentos.id_documento} de la BD:`, dbDeleteError.message);
            }
        }


        return res.status(200).json({
            success: true,
            message: 'Permiso y documento asociado eliminados exitosamente.'
        });

    } catch (error) {
        console.error('Error al eliminar el permiso:', error);
        return res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
    }
};
/**
 * @function descargarDocumentoPermiso
 * @description Permite descargar un documento de aprobación de permiso específico.
 * Accesible para ADMINISTRADORES (cualquier documento) y USUARIOS (sus propios documentos).
 * @param {object} req - Objeto de solicitud de Express (req.params.documentoId, req.user.id, req.user.role).
 * @param {object} res - Objeto de respuesta de Express.
 */
const descargarDocumentoPermiso = async (req, res) => {
    try {
        const documentoId = parseInt(req.params.documentoId);
        const userId = req.user.id;
        const userRole = req.user.role;

        if (isNaN(documentoId)) {
            return res.status(400).json({ success: false, message: 'ID de documento inválido.' });
        }

        const documento = await prisma.documentos.findUnique({
            where: { id_documento: documentoId },
            select: {
                id_documento: true,
                nombre_archivo: true,
                ruta_almacenamiento: true,
                id_trabajador: true, // Necesario para la autorización
                mimetype: true,
                tamano_bytes: true
            }
        });

        if (!documento) {
            return res.status(404).json({ success: false, message: 'Documento no encontrado.' });
        }

        // Regla de autorización: ADMIN puede descargar cualquier documento, USUARIO solo los suyos.
        if (userRole !== Roles.ADMINISTRADOR && documento.id_trabajador !== userId) {
            return res.status(403).json({ success: false, message: 'Acceso denegado. No tiene permisos para descargar este documento.' });
        }

        const filePath = path.join(__dirname, '..', documento.ruta_almacenamiento);

        // Verificar que el archivo realmente existe en el sistema de archivos
        try {
            await stat(filePath); // Intenta obtener el estado del archivo
        } catch (fileError) {
            console.error(`Error al acceder al archivo físico: ${filePath}`, fileError);
            return res.status(404).json({ success: false, message: 'Archivo físico no encontrado en el servidor.' });
        }

        // Establecer las cabeceras para la descarga
        res.setHeader('Content-Type', documento.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${documento.nombre_archivo}"`);
        res.setHeader('Content-Length', documento.tamano_bytes); // Opcional, pero bueno para el cliente

        // Enviar el archivo
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error al descargar el archivo:', err);
                // Si la descarga falló por un problema de stream, no es un error de "no encontrado"
                if (!res.headersSent) { // Solo si no hemos enviado ya una respuesta
                    return res.status(500).json({ success: false, message: 'Error al procesar la descarga del archivo.' });
                }
            }
        });

    } catch (error) {
        console.error('Error en descargarDocumentoPermiso:', error);
        return res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
    }
};
module.exports = {
    validarPermiso,
    crearPermiso,
    listarPermisos,
    obtenerPermisosPorTrabajador,
    consultarMiPermiso,
    eliminarPermiso,
    descargarDocumentoPermiso
};