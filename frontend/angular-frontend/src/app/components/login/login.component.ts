import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-container">
        <!-- Brand Section -->
        <div class="brand-panel">
          <div class="brand-content fade-in-left">
            <svg class="login-logo" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
              <circle cx="40" cy="40" r="38" fill="white" />
              <circle cx="40" cy="40" r="28" fill="none" stroke="#1e3a8a" stroke-width="2" />
              <circle cx="40" cy="40" r="5" fill="#f97316" />
              <text x="40" y="44" text-anchor="middle" fill="#1e3a8a" font-size="12" font-weight="bold">भा</text>
            </svg>
            <h1>Samvidhan Ki Pehchan</h1>
            <p>Empowering Every Citizen with Constitutional Awareness</p>
            <div class="brand-features">
              <div class="feature-item">
                <span class="material-symbols-outlined">verified_user</span>
                <span>Learn Your Fundamental Rights</span>
              </div>
              <div class="feature-item">
                <span class="material-symbols-outlined">gavel</span>
                <span>Explore Landmark Judgments</span>
              </div>
              <div class="feature-item">
                <span class="material-symbols-outlined">smart_toy</span>
                <span>Interact with AI Samvidhan Mitra</span>
              </div>
            </div>
          </div>
          <div class="brand-bg-overlay"></div>
        </div>

        <!-- Form Section -->
        <div class="form-panel fade-in-right">
          <div class="login-box">
            <h2>Welcome Back</h2>
            <p class="subtitle">Please enter your details to sign in</p>
            
            <form (ngSubmit)="onLogin()" #loginForm="ngForm">
              <div class="form-group" [class.focused]="focusedInput === 'username'">
                <label for="username">Username</label>
                <div class="input-wrapper">
                  <span class="material-symbols-outlined">person</span>
                  <input 
                    type="text" 
                    id="username" 
                    [(ngModel)]="username" 
                    name="username" 
                    required 
                    placeholder="Enter your username"
                    (focus)="focusedInput = 'username'"
                    (blur)="focusedInput = ''"
                  >
                </div>
              </div>

              <div class="form-group" [class.focused]="focusedInput === 'password'">
                <label for="password">Password</label>
                <div class="input-wrapper">
                  <span class="material-symbols-outlined">lock</span>
                  <input 
                    type="password" 
                    id="password" 
                    [(ngModel)]="password" 
                    name="password" 
                    required 
                    placeholder="••••••••"
                    (focus)="focusedInput = 'password'"
                    (blur)="focusedInput = ''"
                  >
                </div>
              </div>

              <div class="form-options">
                <label class="remember-me">
                  <input type="checkbox" name="remember">
                  <span>Remember me</span>
                </label>
                <a href="#" class="forgot-link">Forgot password?</a>
              </div>

              <button type="submit" class="login-btn" [disabled]="loading() || !loginForm.form.valid">
                <span *ngIf="!loading()">Sign In</span>
                <div *ngIf="loading()" class="loader"></div>
              </button>

              <p *ngIf="error()" class="error-msg slide-up">
                <span class="material-symbols-outlined">error</span>
                {{ error() }}
              </p>
            </form>

            <div class="auth-footer">
              <p>Don't have an account? <a href="#">Request Access</a></p>
              <div class="hint-box">
                <span class="material-symbols-outlined">lightbulb</span>
                <p>Try <strong>admin</strong> / <strong>admin123</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary: #1e3a8a;
      --secondary: #f97316;
      --bg: #f8fafc;
      --text: #0f172a;
      --muted: #64748b;
      --white: #ffffff;
      --border: #e2e8f0;
      --radius: 12px;
    }

    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg);
      padding: 20px;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .login-container {
      width: 100%;
      max-width: 1000px;
      min-height: 600px;
      background: var(--white);
      border-radius: 24px;
      display: flex;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08);
    }

    /* BRAND PANEL */
    .brand-panel {
      flex: 1;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      padding: 48px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      color: var(--white);
      position: relative;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .brand-panel { display: none; }
    }

    .brand-content {
      position: relative;
      z-index: 2;
    }

    .login-logo {
      width: 60px;
      height: 60px;
      margin-bottom: 24px;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }

    .brand-panel h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .brand-panel p {
      font-size: 18px;
      opacity: 0.9;
      line-height: 1.6;
      margin-bottom: 40px;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      background: rgba(255,255,255,0.1);
      padding: 12px 16px;
      border-radius: 12px;
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.1);
    }

    .feature-item .material-symbols-outlined {
      color: #fcd34d;
    }

    .brand-bg-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
      background-size: 24px 24px;
      z-index: 1;
    }

    /* FORM PANEL */
    .form-panel {
      flex: 1;
      padding: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-box {
      width: 100%;
      max-width: 380px;
    }

    .login-box h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 28px;
      color: var(--text);
      margin-bottom: 8px;
    }

    .subtitle {
      color: var(--muted);
      font-size: 15px;
      margin-bottom: 32px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper .material-symbols-outlined {
      position: absolute;
      left: 12px;
      color: var(--muted);
      font-size: 20px;
      transition: color 0.2s;
    }

    .input-wrapper input {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 15px;
      outline: none;
      transition: all 0.2s;
    }

    .form-group.focused .input-wrapper .material-symbols-outlined {
      color: var(--primary);
    }

    .form-group.focused .input-wrapper input {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.08);
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      font-size: 14px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--muted);
      cursor: pointer;
    }

    .forgot-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
    }

    .login-btn {
      width: 100%;
      padding: 14px;
      background: var(--primary);
      color: var(--white);
      border: none;
      border-radius: var(--radius);
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .login-btn:hover:not(:disabled) {
      background: #1e40af;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
    }

    .login-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    /* ANIMATIONS */
    .fade-in-left {
      animation: fadeInLeft 0.8s ease-out forwards;
    }

    .fade-in-right {
      animation: fadeInRight 0.8s ease-out forwards;
    }

    .slide-up {
      animation: slideUp 0.3s ease-out forwards;
    }

    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .loader {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-msg {
      background: #fef2f2;
      color: #b91c1c;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid #fee2e2;
    }

    .auth-footer {
      margin-top: 32px;
      text-align: center;
      font-size: 14px;
      color: var(--muted);
    }

    .auth-footer a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .hint-box {
      margin-top: 24px;
      padding: 12px;
      background: #fdf2e9;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #9a3412;
      border: 1px dashed #fdba74;
    }

    .hint-box p { margin: 0; }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  focusedInput = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.loading.set(true);
    this.error.set(null);
    this.authService.login(this.username, this.password).subscribe(success => {
      this.loading.set(false);
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('Invalid username or password');
      }
    });
  }
}
