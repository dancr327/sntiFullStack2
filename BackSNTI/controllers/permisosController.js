// controllers/permisosController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadDocumento, TIPOS_DOCUMENTOS } = require('../config/multerConfig'); // Importa la configuración de Multer
const errorHandler = require('../middleware/error-handler'); // Importa tu manejador de errores general
const { handleMulterUpload } = require('../middleware/multer-error-handler'); // Importa el manejador de errores de Multer
const path = require('path');
const fs = require('fs').promises; // Para operaciones de sistema de archivos asíncronas

// Función auxiliar para construir la URL del documento
const getDocumentUrl = (filename, tipoDocumento) => {
  if (!filename || !tipoDocumento) return null;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; // Asegúrate de definir BASE_URL en tus .env
  const uploadDir = TIPOS_DOCUMENTOS[tipoDocumento.toUpperCase()] || TIPOS_DOCUMENTOS.OTRO;
  return `${baseUrl}/uploads/${uploadDir}/${filename}`;
};

// --- GET EXCLUSIVO PARA ADMINISTRADOR ---

// Obtener todos los permisos del sistema
const getAllPermisos = async (req, res) => {
  try {
    const permisos = await prisma.permisos.findMany({
      include: {
        trabajadores: {
          select: {
            nombre: true,
            apellido_paterno: true,
            apellido_materno: true,
            id_trabajador: true
          }
        },
        documentos: true // Incluir el documento asociado
      }
    });

    const permisosConUrl = permisos.map(permiso => ({
      ...permiso,
      documento_url: permiso.documentos ? getDocumentUrl(permiso.documentos.nombre_archivo, permiso.documentos.tipo_documento) : null
    }));

    res.json({ success: true, data: permisosConUrl });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// --- GET PARA ADMINISTRADOR Y USUARIO ---

// Obtener los permisos del trabajador autenticado
const getMyPermisos = async (req, res) => {
  const { id_trabajador } = req.user; // `id_trabajador` viene del token JWT

  try {
    const permisos = await prisma.permisos.findMany({
      where: { id_trabajador: parseInt(id_trabajador) },
      include: {
        trabajadores: {
          select: {
            nombre: true,
            apellido_paterno: true,
            apellido_materno: true,
            id_trabajador: true
          }
        },
        documentos: true // Incluir el documento asociado
      }
    });

    const permisosConUrl = permisos.map(permiso => ({
      ...permiso,
      documento_url: permiso.documentos ? getDocumentUrl(permiso.documentos.nombre_archivo, permiso.documentos.tipo_documento) : null
    }));

    res.json({ success: true, data: permisosConUrl });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// --- RUTAS DE ESCRITURA EXCLUSIVAS DEL ADMINISTRADOR ---

// Crear un nuevo permiso (con subida de archivo opcional)
const createPermiso = async (req, res, next) => {
  // Multer agrega el archivo a req.file
  handleMulterUpload(uploadDocumento.single('documento_aprobacion'))(req, res, async (err) => {
    if (err) {
      return next(err); // Pasa el error a tu errorHandler de Multer
    }

    const { id_trabajador, tipo_permiso, fecha_inicio, fecha_fin, motivo } = req.body;
    const estatus = req.body.estatus || "Pendiente"; // Por defecto "Pendiente" si no se especifica

    if (!id_trabajador || !tipo_permiso || !fecha_inicio || !fecha_fin || !motivo) {
      // Si hay un archivo y faltan datos, borramos el archivo subido para evitar basura
      if (req.file) {
        await fs.unlink(req.file.path).catch(e => console.error('Error al borrar archivo subido:', e));
      }
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios para crear el permiso.' });
    }

    let documentoId = null;
    let newDocument = null;

    try {
      if (req.file) {
        // Guardar información del documento en la tabla 'documentos'
        newDocument = await prisma.documentos.create({
          data: {
            id_trabajador: parseInt(id_trabajador), // Asumimos que el documento siempre está asociado a un trabajador
            nombre_archivo: req.file.filename,
            ruta_archivo: req.file.path,
            mime_type: req.file.mimetype,
            tamano: req.file.size,
            tipo_documento: TIPOS_DOCUMENTOS.APROBACION_PERMISO, // Usar la constante definida
            fecha_subida: new Date(),
          },
        });
        documentoId = newDocument.id_documento;
      }

      const nuevoPermiso = await prisma.permisos.create({
        data: {
          id_trabajador: parseInt(id_trabajador),
          tipo_permiso,
          fecha_inicio: new Date(fecha_inicio),
          fecha_fin: new Date(fecha_fin),
          motivo,
          estatus, // Usar el estatus proporcionado o el predeterminado
          documento_aprobacion_id: documentoId, // Asociar el ID del documento
        },
        include: {
          documentos: true,
          trabajadores: {
             select: {
               nombre: true,
               apellido_paterno: true,
               apellido_materno: true,
               id_trabajador: true
             }
           }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Permiso creado exitosamente.',
        permiso: {
            ...nuevoPermiso,
            documento_url: nuevoPermiso.documentos ? getDocumentUrl(nuevoPermiso.documentos.nombre_archivo, nuevoPermiso.documentos.tipo_documento) : null
        }
      });
    } catch (error) {
      // Si falla la creación del permiso o documento, borramos el archivo si se subió
      if (req.file) {
        await fs.unlink(req.file.path).catch(e => console.error('Error al borrar archivo tras fallo de DB:', e));
      }
      errorHandler(error, req, res);
    }
  });
};

// Actualizar un permiso (con subida de archivo opcional y manejo de estatus)
const updatePermiso = async (req, res, next) => {
  handleMulterUpload(uploadDocumento.single('documento_aprobacion'))(req, res, async (err) => {
    if (err) {
      return next(err); // Pasa el error a tu errorHandler de Multer
    }

    const { id } = req.params;
    const { tipo_permiso, fecha_inicio, fecha_fin, motivo, estatus } = req.body; // 'estatus' ahora es editable

    let documentoId = null;
    let oldDocumentPath = null;
    let oldDocumentId = null;

    try {
      const existingPermiso = await prisma.permisos.findUnique({
        where: { id_permiso: parseInt(id) },
        include: { documentos: true }
      });

      if (!existingPermiso) {
        if (req.file) { // Si subió un archivo para un permiso inexistente, lo borramos
          await fs.unlink(req.file.path).catch(e => console.error('Error al borrar archivo subido:', e));
        }
        return res.status(404).json({ success: false, message: 'Permiso no encontrado.' });
      }

      oldDocumentId = existingPermiso.documento_aprobacion_id;
      if (existingPermiso.documentos) {
        oldDocumentPath = existingPermiso.documentos.ruta_archivo;
      }

      if (req.file) {
        // Eliminar el documento anterior si existe
        if (oldDocumentPath) {
          await fs.unlink(oldDocumentPath).catch(e => console.error('Error al borrar documento anterior:', e));
        }

        // Crear/actualizar nuevo documento
        if (oldDocumentId) {
            // Si ya existía un documento, actualizamos su registro
            const updatedDoc = await prisma.documentos.update({
                where: { id_documento: oldDocumentId },
                data: {
                    nombre_archivo: req.file.filename,
                    ruta_archivo: req.file.path,
                    mime_type: req.file.mimetype,
                    tamano: req.file.size,
                    fecha_subida: new Date(),
                }
            });
            documentoId = updatedDoc.id_documento;
        } else {
            // Si no existía, creamos un nuevo registro de documento
            const newDoc = await prisma.documentos.create({
                data: {
                    id_trabajador: existingPermiso.id_trabajador, // Asociar al mismo trabajador
                    nombre_archivo: req.file.filename,
                    ruta_archivo: req.file.path,
                    mime_type: req.file.mimetype,
                    tamano: req.file.size,
                    tipo_documento: TIPOS_DOCUMENTOS.APROBACION_PERMISO,
                    fecha_subida: new Date(),
                },
            });
            documentoId = newDoc.id_documento;
        }
      } else if (req.body.eliminar_documento === 'true' && oldDocumentPath) {
        // Si se solicita eliminar el documento y no se sube uno nuevo
        await fs.unlink(oldDocumentPath).catch(e => console.error('Error al borrar documento existente:', e));
        if (oldDocumentId) {
            await prisma.documentos.delete({ where: { id_documento: oldDocumentId } });
        }
        documentoId = null; // Quitar la asociación
      } else {
        documentoId = oldDocumentId; // Mantener el documento existente si no se sube ni se elimina
      }

      const permisoActualizado = await prisma.permisos.update({
        where: { id_permiso: parseInt(id) },
        data: {
          tipo_permiso: tipo_permiso || existingPermiso.tipo_permiso,
          fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : existingPermiso.fecha_inicio,
          fecha_fin: fecha_fin ? new Date(fecha_fin) : existingPermiso.fecha_fin,
          motivo: motivo || existingPermiso.motivo,
          estatus: estatus || existingPermiso.estatus, // Actualizar estatus
          documento_aprobacion_id: documentoId, // Actualizar ID del documento
        },
        include: {
          documentos: true,
          trabajadores: {
            select: {
              nombre: true,
              apellido_paterno: true,
              apellido_materno: true,
              id_trabajador: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: 'Permiso actualizado exitosamente.',
        permiso: {
            ...permisoActualizado,
            documento_url: permisoActualizado.documentos ? getDocumentUrl(permisoActualizado.documentos.nombre_archivo, permisoActualizado.documentos.tipo_documento) : null
        }
      });
    } catch (error) {
      // Si falla la actualización, y se subió un nuevo archivo, borramos el nuevo archivo
      if (req.file) {
        await fs.unlink(req.file.path).catch(e => console.error('Error al borrar nuevo archivo tras fallo de DB:', e));
      }
      errorHandler(error, req, res);
    }
  });
};

// Eliminar un permiso (y su documento asociado si existe)
const deletePermiso = async (req, res) => {
  const { id } = req.params;

  try {
    const permisoToDelete = await prisma.permisos.findUnique({
      where: { id_permiso: parseInt(id) },
      include: { documentos: true }
    });

    if (!permisoToDelete) {
      return res.status(404).json({ success: false, message: 'Permiso no encontrado.' });
    }

    // Eliminar el documento físico si existe
    if (permisoToDelete.documentos) {
      await fs.unlink(permisoToDelete.documentos.ruta_archivo).catch(e => console.error('Error al borrar archivo físico:', e));
      // También eliminar el registro del documento de la base de datos
      await prisma.documentos.delete({ where: { id_documento: permisoToDelete.documentos.id_documento } });
    }

    await prisma.permisos.delete({
      where: { id_permiso: parseInt(id) },
    });

    res.json({ success: true, message: 'Permiso eliminado exitosamente.' });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

module.exports = {
  getAllPermisos,
  getMyPermisos,
  createPermiso,
  updatePermiso,
  deletePermiso,
};
