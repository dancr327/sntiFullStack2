import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.auth.currentUser;
    if (user && user.rol === 'ADMINISTRADOR') {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}