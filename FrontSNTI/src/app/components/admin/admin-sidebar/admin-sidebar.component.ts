import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTreeModule } from '@angular/material/tree';
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [MatIconModule,MatTreeModule, CommonModule,RouterLink],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css'
})
export class AdminSidebarComponent {
  @Input() sidebarActive: boolean = false;
  @Output() closeSidebar = new EventEmitter<void>();

    onOverlayClick() {
    this.closeSidebar.emit();
  }

  secretariasAbiertas = false;
    toggleSecretarias() {
    this.secretariasAbiertas = !this.secretariasAbiertas;
  }
}
