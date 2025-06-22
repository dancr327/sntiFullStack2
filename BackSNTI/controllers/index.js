// controllers/index.js


import trabajadorController from './trabajadorController';
import {documentoController} from './documentoController';
import seccionController from './seccionController';
import hijosController from './hijosController'; // Ajusta la ruta si es necesario
import authController from './authController'; // Ajusta la ruta si es necesario
import { permisosController } from './permisosController'; // Ajusta la ruta si es necesario
import {sancionesController} from './sancionesController'; // Ajusta la ruta si es necesario
import {contactosController} from './contactosController'; // Ajusta la ruta si es necesario


module.exports = {
  trabajadorController,
  userController,
  seccionController,
  documentoController,
  hijosController,
  authController,
  permisosController,
  sancionesController,
  contactosController
  
};