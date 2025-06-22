// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { PrismaClient } = require('@prisma/client');
const { errorHandler } = require('./middleware');

const indexRoutes = require('./routes'); // Aquí están agrupadas yaa

const seccionRoutes = require('./routes/seccionRoutes'); // Ajusta la ruta si es necesario
const documentoRoutes = require('./routes/documentoRoutes'); // Ajusta la ruta si es necesario
const hijosRoutes = require('./routes/hijosRoutes'); // Ajusta la ruta si es necesario
const authRoutes = require('./routes/authRoutes'); // Ajusta la ruta si es necesario
const sancionesRoutes = require('./routes/sancionesRoutes'); // Ajusta la ruta si es necesario
const permisosRoutes = require('./routes/permisosRoutes'); // Ajusta la ruta si es necesario
const contactosRoutes = require('./routes/contactosRoutes'); 


const trabajadorRoutes = require('./routes/trabajadorRoutes'); // Ajusta la ruta si es necesario
const authMiddleware = require('./middleware/auth'); // Ajusta la ruta si es necesario

const { obtenerHijosPorTrabajador } = require('./controllers/hijosController');
// Inicializar app y prisma
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de SNTI',
      version: '1.0.0',
      description: 'Documentación de la API del Sistema Nacional de Trabajadores INPI',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'desarrollo@ejemplo.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: { // <-- Asegúrate de tener la sección 'components'
      securitySchemes: { // <-- Aquí va securitySchemes
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./controllers/*.js', './routes/*.js'],
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware globales
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, { explorer: true }));

// Rutas de la API
app.use('/api', indexRoutes,);
app.use('/api/auth', authRoutes); // Monta el enrutador con el prefijo /api/auth
app.use('/trabajadores', trabajadorRoutes);
app.use('/secciones', seccionRoutes); // Monta el enrutador con el prefijo /api/secciones
app.use('/documentos', documentoRoutes); 
app.use('/hijos', hijosRoutes); // Monta el enrutador con el prefijo /api/hijos
app.use('/auth', authRoutes); // Monta el enrutador con el prefijo /api/auth
app.use('/sanciones', sancionesRoutes); // Monta el enrutador con el prefijo /api/sanciones
app.use('/permisos', permisosRoutes); // Monta el enrutador con el prefijo /api/permisos
app.use ('/contactos', contactosRoutes); // Monta el enrutador con el prefijo /api/contactos

// Ruta base (opcional, si es necesario)
app.get('/', (req, res) => {
  res.json({ mensaje: '¡Servidor SNTI corriendo! 🚀' });
});

// Manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
  console.log(`echale ganas `);
  try {
    await prisma.$connect();
    console.log('Conexión a la base de datos establecida');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  }
});

// Manejar cierre limpio
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Conexión a la base de datos cerrada');
  process.exit(0);
});










