const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const prisma = new PrismaClient();
const { TIPOS_DOCUMENTOS } = require('../config/multerConfig'); // Asegúrate de que esta ruta sea correcta
const Roles = require('../enums/roles.enum'); // Asegúrate de tener tu archivo de roles

/**
 * @description Array de validaciones para los campos de un hijo.
 */
const validarHijo = [
    body('nombre').notEmpty().withMessage('El nombre del hijo es obligatorio').isLength({ max: 100 }),
    body('apellido_paterno').notEmpty().withMessage('El apellido paterno del hijo es obligatorio').isLength({ max: 100 }),
    body('apellido_materno').notEmpty().withMessage('El apellido materno del hijo es obligatorio').isLength({ max: 100 }),
    body('fecha_nacimiento').notEmpty().withMessage('La fecha de nacimiento del hijo es obligatoria')
        .isISO8601().withMessage('Formato de fecha de nacimiento inválido (YYYY-MM-DD)'),
];

/**
 * @function actualizarContadorHijos
 * @description Función interna para actualizar el campo 'numero_hijos' del trabajador.
 * @param {number} id_trabajador - ID del trabajador a actualizar.
 * @param {Object} prismaClient - Instancia de Prisma para la transacción.
 */
const actualizarContadorHijos = async (id_trabajador, prismaClient) => {
    const totalHijos = await prismaClient.hijos.count({
        where: {
            id_trabajador: id_trabajador,
            vigente: true // Solo contar hijos que están vigentes
        }
    });

    await prismaClient.trabajadores.update({
        where: { id_trabajador: id_trabajador },
        data: { numero_hijos: totalHijos }
    });
};

/**
 * @function registrarHijo
 * @description Crea un nuevo hijo para el trabajador autenticado.
 * Solo el USUARIO autenticado puede registrar hijos para sí mismo.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 * @returns {Object} Respuesta JSON con el resultado de la operación.
 */
const registrarHijo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo fallido:', err));
        }
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // El ID del trabajador siempre viene del token del usuario autenticado
    const id_trabajador_del_token = req.user.id_trabajador; // Asumo que el token tiene 'id_trabajador'

    const {
        nombre,
        apellido_paterno,
        apellido_materno,
        fecha_nacimiento
    } = req.body;

    const archivo = req.file;
    if (!archivo) {
        return res.status(400).json({ success: false, message: 'El acta de nacimiento es requerida.' });
    }

    let hashArchivo;
    try {
        const archivoBuffer = await fs.readFile(archivo.path);
        hashArchivo = crypto.createHash('sha256').update(archivoBuffer).digest('hex');
    } catch (error) {
        console.error('Error al leer el archivo para calcular el hash:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo fallido:', err));
        }
        return res.status(500).json({ success: false, message: 'Error al procesar el archivo del acta de nacimiento.' });
    }

    try {
        const result = await prisma.$transaction(async (prismaTx) => {
            const documento = await prismaTx.documentos.create({
                data: {
                    id_trabajador: id_trabajador_del_token,
                    tipo_documento: TIPOS_DOCUMENTOS.ACTA_NACIMIENTO,
                    nombre_archivo: archivo.originalname,
                    hash_archivo: hashArchivo,
                    descripcion: `Acta de nacimiento de ${nombre} ${apellido_paterno} ${apellido_materno}`,
                    tipo_archivo: path.extname(archivo.originalname).substring(1),
                    ruta_almacenamiento: path.join(TIPOS_DOCUMENTOS.ACTA_NACIMIENTO, archivo.filename),
                    tamano_bytes: BigInt(archivo.size),
                    es_publico: false,
                    mimetype: archivo.mimetype,
                    metadata: {
                        relacion: "hijo",
                        tipo: "acta_nacimiento"
                    }
                }
            });

            const hijo = await prismaTx.hijos.create({
                data: {
                    id_trabajador: id_trabajador_del_token,
                    nombre,
                    apellido_paterno,
                    apellido_materno,
                    fecha_nacimiento: new Date(fecha_nacimiento),
                    acta_nacimiento_id: documento.id_documento,
                    vigente: true
                }
            });

            // Actualizar el contador de hijos del trabajador
            await actualizarContadorHijos(id_trabajador_del_token, prismaTx);

            return { hijo, documento };
        });

        const { hash_archivo, ...documentoSinHash } = result.documento;
        // ✅ Conversión segura para evitar error de BigInt
        const documentoFormateado = {
            ...documentoSinHash,
            tamano_bytes: documentoSinHash.tamano_bytes.toString()
        };

        return res.status(201).json({
            success: true,
            message: 'Hijo y acta de nacimiento registrados exitosamente',
            data: {
                hijo: result.hijo,
                documento: documentoFormateado
            }
        });

    } catch (error) {
        console.error('Error en registrarHijo:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo después de fallo en DB:', err));
        }
        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message: 'No se pudo asociar el hijo al trabajador. El trabajador especificado no existe.',
                error: error.message
            });
        }
        return res.status(500).json({ success: false, message: 'Error interno del servidor al registrar hijo', error: error.message });
    }
};

/**
 * @function obtenerHijosPorTrabajador
 * @description Obtiene hijos de un trabajador.
 * Si es USUARIO, obtiene sus propios hijos.
 * Si es ADMINISTRADOR, puede obtener hijos de cualquier trabajador por :id_trabajador.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 * @returns {Object} Respuesta JSON con la lista de hijos.
 */
const obtenerHijosPorTrabajador = async (req, res) => {
    try {
        const rolUsuario = req.user.rol;
        let id_trabajador_a_buscar;

        // Lógica de autorización basada en el rol
        if (rolUsuario === Roles.ADMINISTRADOR) {
            // ADMIN puede buscar por ID en la URL params
            const { id_trabajador } = req.params;
            if (!id_trabajador || isNaN(parseInt(id_trabajador))) {
                return res.status(400).json({
                    success: false,
                    message: 'Para administradores, el ID del trabajador es requerido en la URL (ej. /hijos/:id_trabajador) y debe ser un número válido.'
                });
            }
            id_trabajador_a_buscar = parseInt(id_trabajador);
        } else if (rolUsuario === Roles.USUARIO) {
            // USUARIO solo puede ver sus propios hijos
            id_trabajador_a_buscar = req.user.id_trabajador; // Del token
        } else {
            return res.status(403).json({ success: false, message: 'Acceso denegado. Rol no permitido.' });
        }

        const hijos = await prisma.hijos.findMany({
            where: {
                id_trabajador: id_trabajador_a_buscar,
                vigente: true
            },
            include: {
                documentos: {
                    select: {
                        id_documento: true,
                        nombre_archivo: true,
                        tipo_documento: true,
                        fecha_subida: true,
                        ruta_almacenamiento: true,
                        mimetype: true
                    }
                }
            }
        });

        if (!hijos || hijos.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontraron hijos para el trabajador especificado.' });
        }

        // Formatear BigInt para los documentos si existen
        const hijosFormateados = hijos.map(hijo => ({
            ...hijo,
            documentos: hijo.documentos ? {
                ...hijo.documentos,
                tamano_bytes: hijo.documentos.tamano_bytes ? hijo.documentos.tamano_bytes.toString() : null
            } : null
        }));


        return res.status(200).json({ success: true, data: hijosFormateados });

    } catch (error) {
        console.error('Error en obtenerHijosPorTrabajador:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener hijos', error: error.message });
    }
};

/**
 * @function actualizarHijo
 * @description Actualiza la información de un hijo.
 * Un USUARIO solo puede actualizar sus propios hijos.
 * Un ADMINISTRADOR puede actualizar cualquier hijo, pero si actualiza, deberá proveer el id_trabajador en el body.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 * @returns {Object} Respuesta JSON con el resultado de la operación.
 */
const actualizarHijo = async (req, res) => {
    try {
        const { id_hijo } = req.params;
        const id_trabajador_del_token = req.user.id_trabajador;
        const rolUsuario = req.user.rol;

        const {
            nombre,
            apellido_paterno,
            apellido_materno,
            fecha_nacimiento,
            vigente,
            id_trabajador // Esto solo debe ser usado por ADMIN y validado
        } = req.body;

        if (!id_hijo || isNaN(parseInt(id_hijo))) {
            return res.status(400).json({ success: false, message: 'El ID del hijo es requerido y debe ser un número válido.' });
        }

        const hijoExistente = await prisma.hijos.findUnique({
            where: { id_hijo: parseInt(id_hijo) }
        });

        if (!hijoExistente) {
            if (req.file) { // Si hay un archivo subido y el hijo no existe, elimínalo.
                await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo para hijo no encontrado:', err));
            }
            return res.status(404).json({ success: false, message: 'Hijo no encontrado.' });
        }

        let target_id_trabajador = hijoExistente.id_trabajador;

        // Lógica de autorización y manejo de id_trabajador
        if (rolUsuario === Roles.USUARIO) {
            // Un USUARIO solo puede actualizar sus propios hijos
            if (hijoExistente.id_trabajador !== id_trabajador_del_token) {
                if (req.file) { await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo no autorizado:', err)); }
                return res.status(403).json({ success: false, message: 'No tienes permiso para actualizar este hijo.' });
            }
            // Si un USUARIO intenta cambiar el id_trabajador en el body, ignorarlo o denegar
            if (id_trabajador !== undefined && id_trabajador !== id_trabajador_del_token) {
                return res.status(403).json({ success: false, message: 'Un usuario no puede reasignar un hijo a otro trabajador.' });
            }
        } else if (rolUsuario === Roles.ADMINISTRADOR) {
            // Un ADMINISTRADOR puede actualizar cualquier hijo
            if (id_trabajador !== undefined && id_trabajador !== hijoExistente.id_trabajador) {
                // Si el ADMIN intenta reasignar el hijo a otro trabajador
                const nuevoTrabajador = await prisma.trabajadores.findUnique({
                    where: { id_trabajador: id_trabajador }
                });
                if (!nuevoTrabajador) {
                    if (req.file) { await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo para trabajador inexistente:', err)); }
                    return res.status(400).json({ success: false, message: 'El nuevo ID de trabajador proporcionado no existe.' });
                }
                target_id_trabajador = id_trabajador;
            }
        } else {
            if (req.file) { await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo no autorizado:', err)); }
            return res.status(403).json({ success: false, message: 'Acceso denegado. Rol no permitido.' });
        }

        const datosActualizacion = {};
        if (nombre) datosActualizacion.nombre = nombre;
        if (apellido_paterno) datosActualizacion.apellido_paterno = apellido_paterno;
        if (apellido_materno) datosActualizacion.apellido_materno = apellido_materno;
        if (fecha_nacimiento) datosActualizacion.fecha_nacimiento = new Date(fecha_nacimiento);
        if (vigente !== undefined) datosActualizacion.vigente = vigente; // Puede ser false

        // Si el id_trabajador se cambia, se añade a los datos de actualización
        if (target_id_trabajador !== hijoExistente.id_trabajador) {
            datosActualizacion.id_trabajador = target_id_trabajador;
        }

        let old_id_trabajador = hijoExistente.id_trabajador;

        const result = await prisma.$transaction(async (prismaTx) => {
            const hijoActualizado = await prismaTx.hijos.update({
                where: { id_hijo: parseInt(id_hijo) },
                data: datosActualizacion
            });

            let nuevoDocumentoInfo = null;
            if (req.file) {
                const archivo = req.file;

                // Calcular hash del archivo
                const hashArchivo = crypto.createHash('sha256')
                    .update(await fs.readFile(archivo.path))
                    .digest('hex');

                const nuevoDocumento = await prismaTx.documentos.create({
                    data: {
                        id_trabajador: target_id_trabajador, // Asociar con el nuevo trabajador si cambió
                        tipo_documento: TIPOS_DOCUMENTOS.ACTA_NACIMIENTO,
                        nombre_archivo: archivo.originalname,
                        hash_archivo: hashArchivo,
                        descripcion: `Acta de nacimiento actualizada de ${hijoActualizado.nombre} ${hijoActualizado.apellido_paterno} ${hijoActualizado.apellido_materno}`,
                        tipo_archivo: path.extname(archivo.originalname).substring(1),
                        ruta_almacenamiento: path.join(TIPOS_DOCUMENTOS.ACTA_NACIMIENTO, archivo.filename),
                        tamano_bytes: BigInt(archivo.size),
                        es_publico: false,
                        mimetype: archivo.mimetype,
                        metadata: {
                            relacion: "hijo",
                            tipo: "acta_nacimiento",
                            actualizacion: true
                        }
                    }
                });

                // Actualizar la referencia del documento en el hijo
                await prismaTx.hijos.update({
                    where: { id_hijo: parseInt(id_hijo) },
                    data: {
                        acta_nacimiento_id: nuevoDocumento.id_documento
                    }
                });

                const { hash_archivo: docHash, ...docSinHash } = nuevoDocumento;
                nuevoDocumentoInfo = { ...docSinHash, tamano_bytes: docSinHash.tamano_bytes.toString() };
            }

            // Actualizar contadores si el trabajador cambió
            if (old_id_trabajador !== target_id_trabajador) {
                await actualizarContadorHijos(old_id_trabajador, prismaTx); // Descontar del viejo trabajador
                await actualizarContadorHijos(target_id_trabajador, prismaTx); // Contar en el nuevo trabajador
            } else {
                // Si el trabajador no cambió, solo actualiza su contador por si acaso (ej. cambio de 'vigente')
                await actualizarContadorHijos(target_id_trabajador, prismaTx);
            }

            return { hijoActualizado, nuevoDocumentoInfo };
        });

        let message = 'Información del hijo actualizada exitosamente.';
        if (result.nuevoDocumentoInfo) {
            message = 'Información y acta de nacimiento del hijo actualizadas exitosamente.';
        }

        return res.status(200).json({
            success: true,
            message: message,
            data: {
                hijo: result.hijoActualizado,
                documento: result.nuevoDocumentoInfo
            }
        });

    } catch (error) {
        console.error('Error en actualizarHijo:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error('Error al eliminar archivo después de fallo en DB:', err));
        }
        return res.status(500).json({ success: false, message: 'Error al actualizar hijo', error: error.message });
    }
};

/**
 * @function eliminarHijo
 * @description Elimina lógicamente un hijo (establece 'vigente' a false).
 * Un USUARIO solo puede "eliminar" sus propios hijos.
 * Un ADMINISTRADOR puede "eliminar" lógicamente cualquier hijo.
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con el resultado de la operación
 */
const eliminarHijo = async (req, res) => {
    try {
        const { id_hijo } = req.params;
        const id_trabajador_del_token = req.user.id_trabajador; // Del token
        const rolUsuario = req.user.rol;

        if (!id_hijo || isNaN(parseInt(id_hijo))) {
            return res.status(400).json({ success: false, message: 'El ID del hijo es requerido y debe ser un número válido.' });
        }

        const hijoExistente = await prisma.hijos.findUnique({
            where: { id_hijo: parseInt(id_hijo) }
        });

        if (!hijoExistente) {
            return res.status(404).json({ success: false, message: 'Hijo no encontrado.' });
        }

        // Lógica de autorización:
        if (rolUsuario === Roles.USUARIO) {
            if (hijoExistente.id_trabajador !== id_trabajador_del_token) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este hijo.' });
            }
        } else if (rolUsuario !== Roles.ADMINISTRADOR) {
            // Si no es ni USUARIO que le pertenece ni ADMINISTRADOR
            return res.status(403).json({ success: false, message: 'Acceso denegado. Rol no permitido.' });
        }

        // Realizar la eliminación lógica y actualizar el contador en una transacción
        await prisma.$transaction(async (prismaTx) => {
            const hijoEliminado = await prismaTx.hijos.update({
                where: { id_hijo: parseInt(id_hijo) },
                data: { vigente: false } // Marcar como no vigente
            });

            // Actualizar el contador de hijos del trabajador
            await actualizarContadorHijos(hijoEliminado.id_trabajador, prismaTx);

            return hijoEliminado;
        });

        return res.status(200).json({
            success: true,
            message: 'Hijo marcado como no vigente exitosamente (eliminación lógica). El contador de hijos del trabajador ha sido actualizado.',
            data: { id_hijo: parseInt(id_hijo), vigente: false } // Devuelve la confirmación
        });

    } catch (error) {
        console.error('Error en eliminarHijo:', error);
        return res.status(500).json({ success: false, message: 'Error al eliminar hijo', error: error.message });
    }
};

module.exports = {
    validarHijo,
    registrarHijo,
    obtenerHijosPorTrabajador,
    actualizarHijo,
    eliminarHijo
};