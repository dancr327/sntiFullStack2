// routes/index.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, authorizationMiddleware } = require('../middleware');

// Importa los enrutadores de las diferentes rutas
const trabajadorRoutes = require('./trabajadorRoutes');
const authRoutes = require('./authRoutes'); // Este enrutador ya maneja sus propios middlewares internos (login, test-token)
const seccionRoutes = require('./seccionRoutes');
const documentoRoutes = require('./documentoRoutes');
const hijosRoutes = require('./hijosRoutes');
const permisosRoutes = require('./permisosRoutes'); 
const sancionesRoutes = require('./sancionesRoutes'); 




// Rutas que requieren autenticación por defecto (aplican verifyToken y hasRole)
// Nota: El middleware hasRole, si no se le pasan roles, debe manejarlo internamente
// o deberías pasarle un array vacío/un rol por defecto si es una ruta general
// o solo aplicarlo cuando sea necesario un rol específico.
// Si quieres un hasRole general aquí, necesitarás ajustar el middleware para que no falle sin roles.

router.use('/trabajadores', authMiddleware.verifyToken,authorizationMiddleware.hasRole, trabajadorRoutes); // Primero verifica, luego la ruta
router.use('/secciones', authMiddleware.verifyToken, authorizationMiddleware.hasRole, seccionRoutes );
router.use('/documentos', authMiddleware.verifyToken, authorizationMiddleware.hasRole, documentoRoutes);
router.use('/hijos', authMiddleware.verifyToken, hijosRoutes);
router.use('/permisos', authMiddleware.verifyToken, authorizationMiddleware.hasRole, permisosRoutes); // Si tienes un enrutador de permisos
router.use('/sanciones', authMiddleware.verifyToken, authorizationMiddleware.hasRole, sancionesRoutes); // Si tienes un enrutador de sanciones

// Las rutas de autenticación (login, test-token, etc.) NO llevan authMiddleware.verifyToken globalmente aquí.
// Si alguna ruta dentro de authRoutes (como /auth/verify o /auth/logout) necesita token,
// ESE middleware debe estar definido DENTRO de authRoutes.js para esa ruta específica.
router.use('/auth', authRoutes); // ¡Sin middleware de token aquí!


// Ruta base para verificar que la API funcione
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando correctamente',
        version: '1.0.0'
    });
});

module.exports = router;