// file: controllers/documentoController.js
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const path = require("path");
const fsSync = require("node:fs"); // Necesario para verificar si existe el directorio
const { MAPEO_TIPOS_DOCUMENTOS } = require("../config/multerConfig");
const { v4: uuidv4 } = require("uuid"); // Importa uuid para nombres de archivo únicos
const prisma = new PrismaClient();

const fs = require("fs"); // Importar el módulo fs estándar
const { promises: fsPromises } = require("fs"); // Si aún necesitas las promesas en otras partes


/**
 * Controlador para subir un documento al sistema
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con resultado de la operación
 */
const subirDocumento = async (req, res) => {
  let rutaTemporal = null;
  let rutaFinal = null;

  try {
    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo.',
      });
    }

    // Guardar referencia al archivo temporal
    rutaTemporal = req.file.path;

    // Extraer datos del body
    const { id_trabajador, tipo_documento, descripcion } = req.body;
    
    // Validar datos obligatorios
    if (!id_trabajador || !tipo_documento) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren id_trabajador y tipo_documento',
      });
    }

    // Convertir es_publico a booleano
    const es_publico = req.body.es_publico === 'true' || req.body.es_publico === true;
    
    // Extraer información del archivo
    const { originalname, mimetype, size } = req.file;

    // No necesitamos generar un nuevo nombre de archivo ya que Multer ya lo hace
    // El archivo ya está en la carpeta correcta según su tipo_documento
    
    // Guardar la ruta donde el archivo fue almacenado por Multer
    const rutaAlmacenamiento = path.relative(path.join(__dirname, '../uploads'), rutaTemporal);
    
    // La ruta absoluta es la misma que la temporal en este caso
    rutaFinal = rutaTemporal;

    // Calcular el hash SHA-256 del archivo para verificación e integridad
    const fileBuffer = fs.readFileSync(rutaFinal);
    const hashArchivo = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Extraer el tipo de archivo desde el MIME
    const tipoArchivo = mimetype.split('/')[1];

    // Crear metadata estructurada del archivo
    const metadata = JSON.stringify({
      mime_type: mimetype,
      original_name: originalname,
      upload_date: new Date().toISOString(),
      file_size_bytes: size,
    });

    try {
      // Ejecutar el procedimiento almacenado con Prisma
      await prisma.$executeRaw`
        SELECT public.sp_subir_documento(
          ${parseInt(id_trabajador, 10)}::INTEGER,
          ${tipo_documento}::VARCHAR,
          ${metadata}::JSONB,
          ${hashArchivo}::VARCHAR,
          ${originalname}::VARCHAR,
          ${descripcion || null}::TEXT,
          ${tipoArchivo}::VARCHAR,
          ${rutaAlmacenamiento}::TEXT,
          ${size}::BIGINT,
          ${es_publico}::BOOLEAN
        );
      `;
    } catch (dbError) {
      console.error('Error al ejecutar procedimiento almacenado:', dbError);
      
      // Si falla la operación en la base de datos, eliminar el archivo
      if (rutaFinal) {
        fs.unlinkSync(rutaFinal);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error al registrar el documento en la base de datos',
        error: dbError.message,
      });
    }

    // Verificar que el documento fue registrado correctamente
    const documentoSubido = await prisma.documentos.findFirst({
      where: {
        hash_archivo: hashArchivo,
        id_trabajador: parseInt(id_trabajador, 10),
      },
      select: {
        id_documento: true,
        nombre_archivo: true,
        ruta_almacenamiento: true,
        tipo_documento: true,
        fecha_subida: true,
      },
    });

    if (!documentoSubido) {
      // Si no se encuentra el documento, eliminar el archivo
      if (rutaFinal) {
        fs.unlinkSync(rutaFinal);
      }
      
      return res.status(500).json({
        success: false,
        message: 'El documento se procesó pero no se encontró en la base de datos',
      });
    }

    // Responder al cliente con éxito
    return res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: documentoSubido,
    });

  } catch (error) {
    console.error('Error general en subirDocumento:', error);

    // Limpiar archivos temporales o creados en caso de error
    try {
      if (rutaTemporal && fs.existsSync(rutaTemporal)) {
        fs.unlinkSync(rutaTemporal);
      }
      if (rutaFinal && rutaFinal !== rutaTemporal && fs.existsSync(rutaFinal)) {
        fs.unlinkSync(rutaFinal);
      }
    } catch (cleanupError) {
      console.error('Error durante limpieza de archivos:', cleanupError);
    }

    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: error.message,
    });
  }
};
/**
 * Obtiene un documento por su ID
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con el documento o mensaje de error
 */
const obtenerDocumento = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'ID de documento inválido',
      });
    }

    const documento = await prisma.documentos.findUnique({
      where: { id_documento: parseInt(id, 10) },
      select: {
        id_documento: true,
        id_trabajador: true,
        nombre_archivo: true,
        tipo_documento: true,
        descripcion: true,
        fecha_subida: true,
        es_publico: true,
        ruta_almacenamiento: true,
      },
    });

    if (!documento) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: documento,
    });
  } catch (error) {
    console.error('Error al obtener documento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el documento',
      error: error.message,
    });
  }
};

/**
 * Obtiene los documentos asociados a un trabajador
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Object} Respuesta JSON con los documentos del trabajador
 */
const obtenerDocumentosPorTrabajador = async (req, res) => {
  try {
    const { id_trabajador } = req.params;

    // Verificar que el trabajador existe
    const trabajador = await prisma.trabajadores.findUnique({
      where: { id_trabajador: parseInt(id_trabajador) },
    });

    if (!trabajador) {
      return res.status(404).json({
        success: false,
        message: "Trabajador no encontrado",
      });
    }

    // Obtener documentos asociados al trabajador
    const documentos = await prisma.documentos.findMany({
      where: {
        id_trabajador: parseInt(id_trabajador),
        es_publico: true, // Usar es_publico en lugar de activo
      },
      select: {
        id_documento: true,
        tipo_documento: true,
        nombre_archivo: true,
        descripcion: true,
        fecha_subida: true,
        es_publico: true,
        ruta_almacenamiento: true,
      },
      orderBy: {
        fecha_subida: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: documentos,
    });
  } catch (error) {
    console.error("Error al obtener documentos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al recuperar documentos",
      error: error.message,
    });
  }
};

const descargarDocumento = async (req, res) => {
  const { id_documento } = req.params;

  try {
    // Llamar a la función de PostgreSQL para obtener la ruta del archivo
    const result =
      await prisma.$queryRaw`SELECT public.sp_descargar_documento(${parseInt(
        id_documento
      )}::INTEGER) as ruta;`;
    const rutaAlmacenamiento = result[0]?.ruta;

    if (!rutaAlmacenamiento) {
      return res
        .status(404)
        .json({ success: false, message: "Documento no encontrado." });
    }

    const rutaAbsoluta = path.join(
      __dirname,
      "../../uploads",
      rutaAlmacenamiento
    );

    // Verificar si el archivo existe en el sistema de archivos
    if (!fs.existsSync(rutaAbsoluta)) {
      // Usar fs.existsSync
      console.error(`Archivo no encontrado en la ruta: ${rutaAbsoluta}`);
      return res
        .status(404)
        .json({
          success: false,
          message: "El archivo asociado no se encontró en el servidor.",
        });
    }

    // Obtener información del tipo de archivo desde la base de datos (para el Content-Type)
    const documentoInfo = await prisma.documentos.findUnique({
      where: { id_documento: parseInt(id_documento) },
      select: { nombre_archivo: true, tipo_archivo: true, mimetype: true },
    });

    if (!documentoInfo) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Información del documento no encontrada.",
        });
    }

    const nombreArchivo = documentoInfo.nombre_archivo;
    const mimeType =
      documentoInfo.mimetype ||
      `application/${documentoInfo.tipo_archivo || "octet-stream"}`;

    // Configurar los encabezados para la descarga
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${nombreArchivo}"`
    );
    res.setHeader("Content-Type", mimeType);

    // Crear un stream de lectura del archivo y pipearlo a la respuesta
    const fileStream = fs.createReadStream(rutaAbsoluta);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      console.error("Error al leer el archivo:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al leer el archivo del servidor.",
        });
    });
  } catch (error) {
    console.error("Error al descargar el documento:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error al procesar la descarga del documento.",
        error: error.message,
      });
  }
};

module.exports = {
  subirDocumento,
  obtenerDocumentosPorTrabajador,
  descargarDocumento,
};
