import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service' //importo el servicio de autenticación para cerrar sesión
@Component({
  selector: 'app-daniel-sidebar',
  standalone: true,
  imports: [MatIconModule, CommonModule,RouterLink],
  templateUrl: './daniel-sidebar.component.html',
  styleUrl: './daniel-sidebar.component.css'
})
export class DanielSidebarComponent {

  @Input() sidebarActive: boolean = false;
  @Output() closeSidebar = new EventEmitter<void>();

    onOverlayClick() {
    this.closeSidebar.emit();
  }

  constructor(private authService: AuthService) {}
  logout() {
    this.authService.logout();
  }
  
}
