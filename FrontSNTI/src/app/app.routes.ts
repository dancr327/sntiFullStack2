import { Routes, RouterModule } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { roleGuard } from './core/guards/role.guard';
import { GaleriaComponent } from './components/galeria/galeria.component';
export const routes: Routes = [
    // otras rutas
    {path: '', // Ruta raíz (por defecto)
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)}, // Carga HomeComponent aquí

    //user routes NUEVAS para admin-sidebar nueva

            //user routes NUEVAS para danielsidebar nueva
    {
        path: 'admin', loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
        // Aquí se aplica el roleGuard para proteger las rutas de admin
        canActivate: [roleGuard],
        data: { expectedRole: 'ADMINISTRADOR',},
        children: [
    { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) }, // Home del usuario (si tienes uno)
    {path: 'admindocumentos', loadComponent: () => import('./components/admin/documentos/documentos.component').then(m => m.DocumentosComponent)},

    {path: 'admintrabajadores', loadComponent: () => import('./components/admin/trabajadores/trabajadores.component').then(m => m.TrabajadoresComponent)},
                {path: 'registroempleado', loadComponent: () => import('./components/admin/registro-empleado/registro-empleado.component').then(m => m.RegistroEmpleadoComponent)},
                {path: 'editar-trabajador/:id', loadComponent: () => import('./components/admin/registro-empleado/registro-empleado.component').then(m => m.RegistroEmpleadoComponent)},

    {path: 'adminsanciones', loadComponent: () => import('./components/admin/sanciones/sanciones.component').then(m => m.SancionesComponent)},
    {path: 'adminpermisos', loadComponent: () => import('./components/admin/permisos/permisos.component').then(m => m.PermisosComponent)},
    {path: 'adminsecciones', loadComponent: () => import('./components/admin/secciones-sindicales/secciones-sindicales.component').then(m => m.SeccionesSindicalesComponent)},
    {path: 'adminauditorias', loadComponent: () => import('./components/admin/auditorias/auditorias.component').then(m => m.AuditoriasComponent)},
    //SECRETARIAS
                {path: 'trabajoconflictos', loadComponent: () => import('./components/admin/trabajo-conflictos/trabajo-conflictos.component').then(m => m.TrabajoConflictosComponent)},
                {path: 'finanzas', loadComponent: () => import('./components/admin/finanzas/finanzas.component').then(m => m.FinanzasComponent)},
                {path: 'escalafon', loadComponent: () => import('./components/admin/escalafon/escalafon.component').then(m => m.EscalafonComponent)},
                {path: 'actasacuerdos', loadComponent: () => import('./components/admin/organizacion-actas-acuerdos/organizacion-actas-acuerdos.component').then(m => m.OrganizacionActasAcuerdosComponent)},
                {path: 'prestaciones', loadComponent: () => import('./components/admin/prestaciones/prestaciones.component').then(m => m.PrestacionesComponent)},
                {path: 'formacionC', loadComponent: () => import('./components/admin/formacion-capacitacion/formacion-capacitacion.component').then(m => m.FormacionCapacitacionComponent)},
            // ...otros componentes de admin
        ]
    },

    //user routes NUEVAS para danielsidebar nueva
    {
        path: 'user', loadComponent: () => import('./components/user/user.component').then(m => m.UserComponent),
        // Aquí se aplica el roleGuard para proteger las rutas de usuario
        canActivate: [roleGuard],
        data: { expectedRole: 'USUARIO' },
        children: [
            { path: '', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent) }, // Home del usuario (si tienes uno)
            { path: 'userpermiso', loadComponent: () => import('./components/user/userpermiso/userpermiso.component').then(m => m.UserpermisoComponent) },
            { path: 'usersanciones', loadComponent: () => import('./components/user/usersanciones/usersanciones.component').then(m => m.UsersancionesComponent) },
            { path: 'userhijos', loadComponent: () => import('./components/user/userhijos/userhijos.component').then(m => m.UserhijosComponent) },
            { path: 'userperfil', loadComponent: () => import('./components/user/userperfil/userperfil.component').then(m => m.UserperfilComponent) }, // Corregido el path
            // TODO: Asegúrate de que el componente y la ruta existen, o corrige el path si el nombre es diferente
            { path: 'userdocumentospanel', loadComponent: () => import('./components/user/userdocumentospanel/userdocumentospanel.component').then(m => m.UserDocumentosPanelComponent) }, // Corregido el path
            // ...otros componentes de usuario
        ]
    },

    //shared routes
    {path: 'secciones-sindicales', loadComponent: () => import('./components/secciones-sindicales/secciones-sindicales.component').then(m => m.SeccionesSindicalesComponent)},
    {path: 'contacto', loadComponent: () => import('./components/contacto/contacto.component').then(m => m.ContactoComponent)},
    {path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)},
    {path: 'recuperaPassword', loadComponent: () => import('./components/recupera-password/recupera-password.component').then(m => m.RecuperaPasswordComponent)},
    { path: 'galeria', component: GaleriaComponent, title: 'SNTI - Galería' },
    {
  path: 'mas-informacion',
    loadComponent: () => import('./components/informacion-pdf/informacion-pdf.component').then(m => m.InformacionPdfComponent)
  }


];
