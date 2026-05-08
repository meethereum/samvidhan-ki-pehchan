import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api';
  currentUser = signal<string | null>(localStorage.getItem('username'));

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<boolean> {
    const authHeader = 'Basic ' + btoa(`${username}:${password}`);
    const headers = new HttpHeaders({ 'Authorization': authHeader });

    return this.http.get<{ username: string }>(`${this.apiUrl}/auth/me`, { headers }).pipe(
      tap(user => {
        localStorage.setItem('auth', authHeader);
        localStorage.setItem('username', user.username);
        this.currentUser.set(user.username);
      }),
      map(() => true),
      catchError(() => of(false))
    );
  }

  logout() {
    localStorage.removeItem('auth');
    localStorage.removeItem('username');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth');
  }

  getAuthHeader(): string | null {
    return localStorage.getItem('auth');
  }
}
