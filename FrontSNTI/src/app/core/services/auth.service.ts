import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { Usuario } from '../models/usuario.model';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);

  constructor(private http: HttpClient, private router: Router) {this.loadCurrentUser(); }

login(credentials: { identificador: string, contraseña: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(resp => {
        if (resp.success && resp.data?.token) {
          localStorage.setItem('token', resp.data.token);
          localStorage.setItem('usuario', JSON.stringify(resp.data.usuario));
          this.currentUserSubject.next(resp.data.usuario);
        }
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get currentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('usuario');
    if (userStr) {
      this.currentUserSubject.next(JSON.parse(userStr));
    }
  }

}
