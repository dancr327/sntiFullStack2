const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const TipoDocumento = require("../enums/tipodocumento.enum");

const prisma = new PrismaClient();

const TIPOS_PERMITIDOS_PANEL = [
  TipoDocumento.CURP,
  TipoDocumento.RFC,
  TipoDocumento.INE,
  TipoDocumento.CERTIFICADO_ESTUDIO,
  TipoDocumento.OTRO_DOCUMENTO
];

// Normaliza ruta a formato curp/archivo.pdf, nunca con uploads/ y siempre con /
function normalizeUploadPath(rawPath) {
  let ruta = rawPath.replace(/\\/g, '/');
  if (ruta.startsWith('uploads/')) ruta = ruta.substring(8);
  return ruta;
}

// Construye la ruta absoluta al archivo físico
function buildAbsolutePath(rutaAlmacenamiento) {
  const rutaRelativa = normalizeUploadPath(rutaAlmacenamiento);
  return path.join(__dirname, '..', 'uploads', rutaRelativa);
}

// SUBIR DOCUMENTO PANEL
const subirDocumento = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Archivo no enviado" });
    }
    const { id_trabajador, tipo_documento, descripcion } = req.body;

    if (!id_trabajador || !tipo_documento) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });
    }
    if (!TIPOS_PERMITIDOS_PANEL.includes(tipo_documento)) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, message: "Tipo de documento no permitido en el panel" });
    }
    const existente = await prisma.documentos.findFirst({
      where: {
        id_trabajador: parseInt(id_trabajador),
        tipo_documento
      }
    });
    if (existente) {
      await fs.unlink(req.file.path);
      return res.status(409).json({
        success: false,
        message: `Ya existe un documento de tipo ${tipo_documento} para este trabajador.`
      });
    }

    // Guarda SOLO la ruta relativa al directorio uploads (ej: curp/archivo.pdf)
    const rutaRelativa = path.relative(
      path.join(__dirname, '..', 'uploads'),
      req.file.path
    ).replace(/\\/g, '/');

    const tipoArchivo = req.file.mimetype.split('/')[1];
    const fileBuffer = await fs.readFile(req.file.path);
    const hashArchivo = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const metadata = JSON.stringify({
      mime_type: req.file.mimetype,
      original_name: req.file.originalname,
      upload_date: new Date().toISOString(),
      file_size_bytes: req.file.size
    });

    const nuevoDoc = await prisma.documentos.create({
      data: {
        id_trabajador: parseInt(id_trabajador),
        tipo_documento,
        metadata,
        hash_archivo: hashArchivo,
        nombre_archivo: req.file.originalname,
        descripcion: descripcion || null,
        tipo_archivo: tipoArchivo,
        ruta_almacenamiento: rutaRelativa, // RUTA RELATIVA LIMPIA
        tamano_bytes: req.file.size,
        es_publico: true,
        mimetype: req.file.mimetype
      },
      select: {
        id_documento: true,
        tipo_documento: true,
        nombre_archivo: true,
        ruta_almacenamiento: true,
        fecha_subida: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: nuevoDoc
    });

  } catch (error) {
    console.error('Error al subir documento:', error);
    if (req.file?.path) {
      try { await fs.unlink(req.file.path); } catch { }
    }
    return res.status(500).json({ success: false, message: 'Error en servidor', error: error.message });
  }
};

// OBTENER DOCUMENTO POR TIPO
const obtenerDocumentoPorTipo = async (req, res) => {
  try {
    const { id_trabajador, tipo_documento } = req.params;
    const doc = await prisma.documentos.findFirst({
      where: {
        id_trabajador: parseInt(id_trabajador),
        tipo_documento
      },
      select: {
        id_documento: true,
        tipo_documento: true,
        nombre_archivo: true,
        descripcion: true,
        ruta_almacenamiento: true,
        fecha_subida: true
      }
    });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    console.error('Error al obtener documento:', error);
    return res.status(500).json({ success: false, message: 'Error en servidor', error: error.message });
  }
};

// ELIMINAR DOCUMENTO POR TIPO
const eliminarDocumentoPorTipo = async (req, res) => {
  try {
    const { id_trabajador, tipo_documento } = req.params;
    const doc = await prisma.documentos.findFirst({
      where: {
        id_trabajador: parseInt(id_trabajador),
        tipo_documento
      }
    });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }
    const rutaAbsoluta = buildAbsolutePath(doc.ruta_almacenamiento);
    try {
      await fs.unlink(rutaAbsoluta);
    } catch (e) {
      // Si el archivo no existe, no es fatal
      console.warn(`No se pudo borrar el archivo físico (${rutaAbsoluta}):`, e.message);
    }
    await prisma.documentos.delete({ where: { id_documento: doc.id_documento } });
    return res.status(200).json({ success: true, message: 'Documento eliminado' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return res.status(500).json({ success: false, message: 'Error en servidor', error: error.message });
  }
};

// DESCARGAR DOCUMENTO PANEL
const descargarDocumento = async (req, res) => {
  try {
    const documentoId = parseInt(req.params.id_documento, 10);
    if (isNaN(documentoId)) {
      return res.status(400).json({ success: false, message: 'ID de documento inválido.' });
    }
    const doc = await prisma.documentos.findUnique({
      where: { id_documento: documentoId }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado en la base de datos.' });
    }

    // Siempre trabaja solo con la ruta relativa, NO debe tener uploads/
    const rutaRelativa = doc.ruta_almacenamiento.replace(/\\/g, '/').replace(/^uploads\//, '');
    const filePath = path.join(__dirname, '..', 'uploads', rutaRelativa);

    console.log('DEBUG: Buscando archivo en:', filePath);

    try {
      await fs.stat(filePath);
      console.log('DEBUG: Archivo encontrado:', filePath);
    } catch {
      console.log('DEBUG: Archivo no existe:', filePath);
      return res.status(404).json({ success: false, message: 'Archivo físico no encontrado en el servidor.' });
    }

    res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.nombre_archivo}"`);
    res.setHeader('Content-Length', doc.tamano_bytes);

    return res.download(filePath, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, message: 'Error al procesar la descarga del archivo.' });
        }
      }
    });
  } catch (error) {
    console.error('Error en descargarDocumento:', error);
    return res.status(500).json({ success: false, message: 'Error del servidor.', error: error.message });
  }
};



module.exports = {
  subirDocumento,
  obtenerDocumentoPorTipo,
  eliminarDocumentoPorTipo,
  descargarDocumento
};