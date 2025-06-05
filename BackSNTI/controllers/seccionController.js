// controllers/seccionController.js
const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();

// Helper para enviar respuestas consistentes
const sendResponse = (res, success, statusCode, message, data = null, errors = null) => {
    res.status(statusCode).json({
        success,
        message,
        data,
        errors
    });
};

/**
 * Obtener todas las secciones.
 * Permite a ADMINISTRADOR y USUARIO.
 */
const getAllSecciones = async (req, res) => {
    try {
        const secciones = await prisma.secciones.findMany({
            orderBy: { nombre_seccion: 'asc' } // Ordenar alfabéticamente
        });
        sendResponse(res, true, 200, 'Secciones obtenidas exitosamente', secciones);
    } catch (error) {
        console.error('Error al obtener todas las secciones:', error);
        sendResponse(res, false, 500, 'Error interno del servidor al obtener secciones', null, error.message);
    }
};

/**
 * Obtener sección por ID.
 * Permite a ADMINISTRADOR y USUARIO.
 */
const getSeccionById = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse(res, false, 400, 'Datos de entrada inválidos', null, errors.array());
    }

    const { id } = req.params;
    try {
        const seccion = await prisma.secciones.findUnique({
            where: { id_seccion: parseInt(id) } // Asegúrate de parsear a entero
        });

        if (!seccion) {
            return sendResponse(res, false, 404, 'Sección no encontrada');
        }

        sendResponse(res, true, 200, 'Sección obtenida exitosamente', seccion);
    } catch (error) {
        console.error('Error al obtener sección por ID:', error);
        sendResponse(res, false, 500, 'Error interno del servidor al obtener sección', null, error.message);
    }
};

/**
 * Obtener Sección por Nombre (manteniendo tu funcionalidad, pero por ID es más robusto si el nombre cambia)
 * Permite a ADMINISTRADOR y USUARIO.
 */
const getSeccionPorNombre = async (req, res) => {
    const errors = validationResult(req); // Usar validationResult de express-validator
    if (!errors.isEmpty()) {
        return sendResponse(res, false, 400, 'Datos de entrada inválidos', null, errors.array());
    }

    const { nombre } = req.params;
    const trimmedNombre = nombre.trim();

    try {
        const seccion = await prisma.secciones.findUnique({
            where: { nombre_seccion: trimmedNombre }
        });

        if (!seccion) {
            return sendResponse(res, false, 404, 'Sección no encontrada');
        }

        sendResponse(res, true, 200, 'Sección obtenida exitosamente', seccion);
    } catch (error) {
        console.error('Error al obtener sección por nombre:', error);
        sendResponse(res, false, 500, 'Error interno del servidor al obtener sección', null, error.message);
    }
};

/**
 * Actualizar Sección (PATCH).
 * Exclusivo para ADMINISTRADOR.
 * Permite actualizar por ID o Nombre. Optaremos por ID ya que es más estable.
 */
const updateSeccion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse(res, false, 400, 'Datos de entrada inválidos', null, errors.array());
    }

    // Usaremos el ID para la actualización, es más robusto que el nombre para el identificador de la URL
    const { id } = req.params;
    const { nombre_seccion, descripcion } = req.body;

    // Objeto para almacenar los campos a actualizar
    const dataToUpdate = {};
    if (nombre_seccion !== undefined) {
        dataToUpdate.nombre_seccion = nombre_seccion.trim();
    }
    if (descripcion !== undefined) {
        dataToUpdate.descripcion = descripcion.trim();
    }

    if (Object.keys(dataToUpdate).length === 0) {
        return sendResponse(res, false, 400, 'No hay datos para actualizar');
    }

    try {
        const seccionExistente = await prisma.secciones.findUnique({
            where: { id_seccion: parseInt(id) }
        });

        if (!seccionExistente) {
            return sendResponse(res, false, 404, 'Sección no encontrada');
        }

        // Si se intenta cambiar el nombre, verificar unicidad
        if (dataToUpdate.nombre_seccion && dataToUpdate.nombre_seccion !== seccionExistente.nombre_seccion) {
            const nombreExistente = await prisma.secciones.findUnique({
                where: { nombre_seccion: dataToUpdate.nombre_seccion },
                select: { id_seccion: true }
            });
            if (nombreExistente) {
                return sendResponse(res, false, 409, 'El nuevo nombre de sección ya está en uso');
            }
        }

        const seccionActualizada = await prisma.secciones.update({
            where: { id_seccion: parseInt(id) },
            data: dataToUpdate
        });

        sendResponse(res, true, 200, 'Sección actualizada exitosamente', seccionActualizada);
    } catch (error) {
        console.error('Error al actualizar sección:', error);
        sendResponse(res, false, 500, 'Error interno del servidor al actualizar sección', null, error.message);
    }
};

// **NUEVO** para crear secciones (necesario para PATCH y GET)
const createSeccion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse(res, false, 400, 'Datos de entrada inválidos', null, errors.array());
    }

    const { nombre_seccion, descripcion } = req.body;

    try {
        const seccionExistente = await prisma.secciones.findUnique({
            where: { nombre_seccion: nombre_seccion.trim() }
        });

        if (seccionExistente) {
            return sendResponse(res, false, 409, 'El nombre de sección ya existe');
        }

        const nuevaSeccion = await prisma.secciones.create({
            data: {
                nombre_seccion: nombre_seccion.trim(),
                descripcion: descripcion ? descripcion.trim() : null
            }
        });

        sendResponse(res, true, 201, 'Sección creada exitosamente', nuevaSeccion);
    } catch (error) {
        console.error('Error al crear sección:', error);
        sendResponse(res, false, 500, 'Error interno del servidor al crear sección', null, error.message);
    }
};

// **NUEVO** para eliminar secciones
const deleteSeccion = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendResponse(res, false, 400, 'Datos de entrada inválidos', null, errors.array());
    }

    const { id } = req.params;

    try {
        const seccionExistente = await prisma.secciones.findUnique({
            where: { id_seccion: parseInt(id) }
        });

        if (!seccionExistente) {
            return sendResponse(res, false, 404, 'Sección no encontrada');
        }

        // Antes de eliminar la sección, verifica si hay trabajadores asociados.
        // Si tienes una relación en Prisma, puedes usar `trabajadores` aquí.
        const trabajadoresAsociados = await prisma.trabajadores.count({
            where: { id_seccion: parseInt(id) }
        });

        if (trabajadoresAsociados > 0) {
            return sendResponse(res, false, 400, 'No se puede eliminar la sección porque tiene trabajadores asociados. Elimine los trabajadores primero o reasígnelos.');
        }

        await prisma.secciones.delete({
            where: { id_seccion: parseInt(id) }
        });

        sendResponse(res, true, 200, 'Sección eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar sección:', error);
        sendResponse(res, false, 500, 'Error interno del servidor al eliminar sección', null, error.message);
    }
};


module.exports = {
    getAllSecciones,
    getSeccionById,
    getSeccionPorNombre, // Mantener si es necesario, pero recomiendo priorizar por ID
    updateSeccion,
    createSeccion,
    deleteSeccion
};