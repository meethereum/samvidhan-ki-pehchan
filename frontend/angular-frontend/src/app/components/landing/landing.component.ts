import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="landing-page">
      <!-- Top Navigation -->
      <nav class="top-nav fade-in">
        <div class="nav-brand">
          <svg class="nav-logo" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" fill="#1e3a8a" />
            <circle cx="40" cy="40" r="28" fill="none" stroke="#f97316" stroke-width="2" />
            <text x="40" y="44" text-anchor="middle" fill="white" font-size="12" font-weight="bold">भा</text>
          </svg>
          <span class="brand-name">Samvidhan Ki Pehchan</span>
        </div>
        <div class="nav-links">
          <a routerLink="/login" class="nav-btn-outline">Sign In</a>
          <a routerLink="/login" class="nav-btn-primary">Get Started</a>
        </div>
      </nav>

      <!-- Hero Section -->
      <header class="hero-section">
        <div class="hero-content fade-in-up">
          <div class="hero-badge">NATIONAL AWARENESS PLATFORM</div>
          <h1>The Soul of <span class="text-gradient">Indian Democracy</span></h1>
          <p>Explore the world's longest written constitution through an interactive, AI-powered journey. Understand your rights, fulfill your duties, and witness the history that shaped a nation.</p>
          <div class="hero-actions">
            <a routerLink="/login" class="btn-primary lg">
              Start Your Journey
              <span class="material-symbols-outlined">arrow_forward</span>
            </a>
            <a href="#features" class="btn-text">
              Learn More
              <span class="material-symbols-outlined">expand_more</span>
            </a>
          </div>
        </div>
        <div class="hero-image-wrap fade-in">
          <div class="hero-abstract-shape"></div>
          <img src="preamble-ncert.png" alt="Preamble" class="hero-img">
        </div>
      </header>

      <!-- Tricolor Accent -->
      <div class="tricolor-divider"></div>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="section-header fade-in-up">
          <h2>Everything you need to know</h2>
          <p>Comprehensive tools and resources for constitutional literacy.</p>
        </div>

        <div class="features-grid">
          <div class="feature-card fade-in-up" style="animation-delay: 0.1s">
            <div class="icon-box orange">
              <span class="material-symbols-outlined">history_edu</span>
            </div>
            <h3>Historical Journey</h3>
            <p>Trace the 2 years, 11 months, and 18 days of the Constituent Assembly's work.</p>
          </div>

          <div class="feature-card fade-in-up" style="animation-delay: 0.2s">
            <div class="icon-box blue">
              <span class="material-symbols-outlined">auto_stories</span>
            </div>
            <h3>Articles Hub</h3>
            <p>Simplified explanations of all 448 articles, parts, and schedules.</p>
          </div>

          <div class="feature-card fade-in-up" style="animation-delay: 0.3s">
            <div class="icon-box green">
              <span class="material-symbols-outlined">balance</span>
            </div>
            <h3>Rights & Duties</h3>
            <p>Know your 6 fundamental rights and 11 fundamental duties at your fingertips.</p>
          </div>

          <div class="feature-card fade-in-up" style="animation-delay: 0.4s">
            <div class="icon-box navy">
              <span class="material-symbols-outlined">smart_toy</span>
            </div>
            <h3>AI Samvidhan Mitra</h3>
            <p>Ask our intelligent assistant any question about the Indian Constitution.</p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-card fade-in">
          <h2>Ready to become a more aware citizen?</h2>
          <p>Join thousands of others learning about our constitutional foundation today.</p>
          <a routerLink="/login" class="btn-white">Create Your Account</a>
        </div>
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-content">
          <div class="footer-brand">
            <span class="brand-name">Samvidhan Ki Pehchan</span>
            <p>Promoting constitutional literacy across India.</p>
          </div>
          <div class="footer-bottom">
            <p>© 2026 Samvidhan Ki Pehchan · Article 51A(a) Compliance</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      --primary: #1e3a8a;
      --secondary: #f97316;
      --green: #15803d;
      --bg: #ffffff;
      --bg-alt: #f8fafc;
      --text: #0f172a;
      --muted: #64748b;
      --radius: 20px;
    }

    .landing-page {
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* NAVIGATION */
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 8%;
      position: sticky;
      top: 0;
      background: rgba(255,255,255,0.8);
      backdrop-filter: blur(12px);
      z-index: 100;
      border-bottom: 1px solid #f1f5f9;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .nav-logo {
      width: 40px;
      height: 40px;
    }

    .brand-name {
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 20px;
      color: var(--primary);
      letter-spacing: -0.5px;
    }

    .nav-links {
      display: flex;
      gap: 16px;
    }

    .nav-btn-outline {
      padding: 10px 20px;
      border-radius: 12px;
      text-decoration: none;
      color: var(--primary);
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
    }

    .nav-btn-primary {
      padding: 10px 24px;
      background: var(--primary);
      color: white;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
      transition: all 0.2s;
    }

    .nav-btn-primary:hover {
      transform: translateY(-1px);
      background: #1e40af;
    }

    /* HERO SECTION */
    .hero-section {
      display: flex;
      align-items: center;
      padding: 80px 8% 120px;
      gap: 60px;
      max-width: 1400px;
      margin: 0 auto;
    }

    @media (max-width: 1024px) {
      .hero-section { flex-direction: column; padding-top: 40px; text-align: center; }
    }

    .hero-content {
      flex: 1.2;
    }

    .hero-badge {
      display: inline-block;
      padding: 6px 16px;
      background: #dbeafe;
      color: var(--primary);
      border-radius: 100px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 24px;
    }

    .hero-section h1 {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(40px, 6vw, 64px);
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 24px;
      color: #0f172a;
    }

    .text-gradient {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-section p {
      font-size: 18px;
      line-height: 1.6;
      color: var(--muted);
      margin-bottom: 40px;
      max-width: 600px;
    }

    @media (max-width: 1024px) { .hero-section p { margin-left: auto; margin-right: auto; } }

    .hero-actions {
      display: flex;
      gap: 20px;
      align-items: center;
    }

    @media (max-width: 1024px) { .hero-actions { justify-content: center; } }

    .btn-primary.lg {
      padding: 16px 32px;
      background: var(--primary);
      color: white;
      border-radius: 16px;
      text-decoration: none;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 25px rgba(30, 58, 138, 0.25);
      transition: all 0.3s;
    }

    .btn-primary.lg:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(30, 58, 138, 0.35); }

    .btn-text {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }

    .hero-image-wrap {
      flex: 1;
      position: relative;
    }

    .hero-img {
      width: 100%;
      max-width: 500px;
      border-radius: 12px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.12);
      position: relative;
      z-index: 2;
    }

    .hero-abstract-shape {
      position: absolute;
      top: -10%;
      right: -10%;
      width: 120%;
      height: 120%;
      background: radial-gradient(circle, #dbeafe 0%, transparent 70%);
      z-index: 1;
      border-radius: 50%;
    }

    /* TRICOLOR DIVIDER */
    .tricolor-divider {
      height: 8px;
      background: linear-gradient(to right, #f97316 33.3%, #ffffff 33.3% 66.6%, #15803d 66.6%);
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    /* FEATURES SECTION */
    .features-section {
      padding: 100px 8%;
      background: var(--bg-alt);
    }

    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-header h2 {
      font-family: 'Outfit', sans-serif;
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 32px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .feature-card {
      background: white;
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
      transition: all 0.3s;
      border: 1px solid #f1f5f9;
    }

    .feature-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }

    .icon-box {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .icon-box .material-symbols-outlined { font-size: 28px; }
    .icon-box.orange { background: #fff7ed; color: #f97316; }
    .icon-box.blue { background: #eff6ff; color: #3b82f6; }
    .icon-box.green { background: #f0fdf4; color: #22c55e; }
    .icon-box.navy { background: #eef2ff; color: #1e3a8a; }

    .feature-card h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; }
    .feature-card p { color: var(--muted); line-height: 1.6; }

    /* CTA SECTION */
    .cta-section { padding: 100px 8%; }
    .cta-card {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      padding: 80px 40px;
      border-radius: 40px;
      text-align: center;
      color: white;
      max-width: 1000px;
      margin: 0 auto;
      box-shadow: 0 20px 50px rgba(30, 58, 138, 0.3);
    }

    .cta-card h2 { font-family: 'Outfit', sans-serif; font-size: 40px; font-weight: 700; margin-bottom: 24px; }
    .cta-card p { font-size: 20px; opacity: 0.9; margin-bottom: 40px; }

    .btn-white {
      display: inline-block;
      padding: 16px 40px;
      background: white;
      color: var(--primary);
      text-decoration: none;
      border-radius: 16px;
      font-weight: 700;
      font-size: 18px;
      transition: all 0.2s;
    }
    .btn-white:hover { transform: scale(1.05); }

    /* FOOTER */
    .landing-footer { padding: 80px 8% 40px; border-top: 1px solid #f1f5f9; }
    .footer-content { max-width: 1200px; margin: 0 auto; text-align: center; }
    .footer-bottom { margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; color: var(--muted); font-size: 14px; }

    /* ANIMATIONS */
    .fade-in { animation: fadeIn 1s ease-out forwards; }
    .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fadeInUp { 
      from { opacity: 0; transform: translateY(40px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
  `]
})
export class LandingComponent {}
