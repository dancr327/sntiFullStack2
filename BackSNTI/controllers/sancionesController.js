// controllers/sancionesController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const manejadorErrores = require('../middleware/error-handler'); // Importa tu manejador de errores general

// --- Consultas (para ADMINISTRADOR) ---

/**
 * Obtiene todas las sanciones registradas en el sistema.
 * Solo accesible para el rol ADMINISTRADOR.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
const obtenerTodasLasSanciones = async (req, res) => {
  try {
    const sanciones = await prisma.sanciones.findMany({
      include: {
        trabajadores: {
          select: {
            id_trabajador: true,
            nombre: true,
            apellido_paterno: true,
            apellido_materno: true,
            numero_empleado: true
          }
        }
      },
      orderBy: {
        fecha_aplicacion: 'desc' // Ordenar por fecha de aplicación descendente
      }
    });
    res.json({ success: true, datos: sanciones });
  } catch (error) {
    manejadorErrores(error, req, res);
  }
};

/**
 * Obtiene una sanción específica por ID.
 * Solo accesible para el rol ADMINISTRADOR.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
const obtenerSancionPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const sancion = await prisma.sanciones.findUnique({
      where: { id_sancion: parseInt(id) },
      include: {
        trabajadores: {
          select: {
            id_trabajador: true,
            nombre: true,
            apellido_paterno: true,
            apellido_materno: true,
            numero_empleado: true
          }
        }
      }
    });

    if (!sancion) {
      return res.status(404).json({ success: false, mensaje: 'Sanción no encontrada.' });
    }
    res.json({ success: true, datos: sancion });
  } catch (error) {
    manejadorErrores(error, req, res);
  }
};

// --- Consultas (para ADMINISTRADOR y USUARIO) ---

/**
 * Obtiene las sanciones asociadas al trabajador autenticado.
 * Accesible para roles ADMINISTRADOR y USUARIO.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
const obtenerMisSanciones = async (req, res) => {
  const { id_trabajador } = req.user; // `id_trabajador` viene del token JWT

  try {
    const sanciones = await prisma.sanciones.findMany({
      where: { id_trabajador: parseInt(id_trabajador) },
      include: {
        trabajadores: {
          select: {
            id_trabajador: true,
            nombre: true,
            apellido_paterno: true,
            apellido_materno: true,
            numero_empleado: true
          }
        }
      },
      orderBy: {
        fecha_aplicacion: 'desc'
      }
    });
    res.json({ success: true, datos: sanciones });
  } catch (error) {
    manejadorErrores(error, req, res);
  }
};

// --- Creación (solo ADMINISTRADOR) ---

/**
 * Crea una nueva sanción.
 * Solo accesible para el rol ADMINISTRADOR.
 * @param {Object} req - Objeto de solicitud Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
const crearSancion = async (req, res) => {
  const { id_trabajador, tipo_sancion, descripcion, fecha_aplicacion, fecha_fin } = req.body;
  // El estatus de la sanción se mantiene por defecto en "No" o se puede ajustar internamente.
  // No permitimos que el usuario lo establezca directamente.
  const usuarioRegistro = req.user.identificador || req.user.email || 'Sistema'; 

  if (!id_trabajador || !tipo_sancion || !descripcion || !fecha_aplicacion) {
    return res.status(400).json({ success: false, mensaje: 'Faltan campos obligatorios para crear la sanción.' });
  }

  try {
    const nuevaSancion = await prisma.sanciones.create({
      data: {
        id_trabajador: parseInt(id_trabajador),
        tipo_sancion,
        descripcion,
        fecha_aplicacion: new Date(fecha_aplicacion),
        fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
        estatus: "No", // Siempre se crea como "No" (no vigente por defecto)
        usuario_registro: usuarioRegistro,
      },
      include: {
        trabajadores: {
          select: {
            id_trabajador: true,
            nombre: true,
            apellido_paterno: true,
            apellido_materno: true,
            numero_empleado: true
          }
        }
      }
    });
    res.status(201).json({ success: true, mensaje: 'Sanción creada exitosamente.', sancion: nuevaSancion });
  } catch (error) {
    manejadorErrores(error, req, res);
  }
};

module.exports = {
  obtenerTodasLasSanciones,
  obtenerSancionPorId,
  obtenerMisSanciones,
  crearSancion,
  // Ya no exportamos 'actualizarSancion' ni 'eliminarSancion'
};