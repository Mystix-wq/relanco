'use client'
import Link from 'next/link'

export default function LandingPage() {
  const T = {
    bg: '#F7F5F0', navy: '#1B2A4A', coral: '#E05C3A',
    border: '#E2DDD5', textDim: '#8A90A0', textMid: '#5A6478',
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.navy }}>
      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: `1px solid ${T.border}`, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: T.navy, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏡</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>Relanco</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" style={{ padding: '9px 20px', borderRadius: 8, border: `1px solid ${T.border}`, color: T.textMid, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Connexion</Link>
          <Link href="/register" style={{ padding: '9px 20px', borderRadius: 8, background: T.coral, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Essai gratuit</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '90px 40px 70px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(38px,5vw,68px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 22, letterSpacing: '-0.02em' }}>
          Ne perdez plus jamais<br />
          <em style={{ color: T.coral, fontStyle: 'italic' }}>un acheteur par manque de suivi.</em>
        </h1>
        <p style={{ fontSize: 18, color: T.textMid, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.65 }}>
          Relanco centralise vos acheteurs, trace chaque visite, et génère automatiquement le message de relance parfait grâce à l'IA.
        </p>
        <Link href="/register" style={{ display: 'inline-block', padding: '14px 36px', background: T.coral, color: '#fff', borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
          Commencer gratuitement →
        </Link>

        {/* STATS */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 56, marginTop: 70, borderTop: `1px solid ${T.border}`, paddingTop: 56, flexWrap: 'wrap' }}>
          {[['2 min', 'Pour démarrer'], ['10 sec', 'Par message IA'], ['0€', 'Pour tester'], ['100%', 'Données sécurisées']].map(([v, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: T.coral }}>{v}</div>
              <div style={{ color: T.textDim, fontSize: 13, marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 40px 80px' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, textAlign: 'center', marginBottom: 48 }}>Comment ça marche</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 20 }}>
          {[
            ['1', '👤 Créez un profil', 'Budget, critères, zones, source. Toutes les infos de votre acheteur en un endroit.'],
            ['2', '🏠 Enregistrez chaque visite', 'Adresse, prix, réaction. En 30 secondes après chaque visite.'],
            ['3', '✦ Générez le suivi IA', "L'IA rédige le message parfait selon la réaction de l'acheteur. Copiez et envoyez."],
            ['4', '📊 Suivez votre pipeline', 'Dashboard clair, alertes de relance, statistiques de performance.'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 16, padding: '26px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{title.split(' ').slice(1).join(' ').substring(0,2)}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
              <p style={{ color: T.textMid, fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div style={{ background: T.navy, padding: '80px 40px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: '#fff', marginBottom: 12 }}>Un prix simple</h2>
        <p style={{ color: '#8A90A0', marginBottom: 48, fontSize: 15 }}>14 jours gratuits, sans carte bancaire.</p>
        <div style={{ display: 'inline-block', background: '#fff', borderRadius: 20, padding: '40px 52px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 700, color: T.navy }}>59€</div>
          <div style={{ color: T.textMid, marginBottom: 28, fontSize: 15 }}>/mois par agent</div>
          {['Acheteurs illimités', 'Messages IA illimités', 'Historique complet', 'Support par email', 'Mises à jour incluses'].map(f => (
            <div key={f} style={{ padding: '8px 0', borderBottom: `1px solid ${T.border}`, color: T.textMid, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#2A7A5B', fontWeight: 700 }}>✓</span> {f}
            </div>
          ))}
          <Link href="/register" style={{ display: 'block', marginTop: 28, padding: '14px', background: T.coral, color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            Commencer l'essai gratuit
          </Link>
        </div>
      </div>

      <footer style={{ padding: '28px', textAlign: 'center', color: T.textDim, fontSize: 12, borderTop: `1px solid ${T.border}` }}>
        © 2025 Relanco · contact@relanco.fr
      </footer>
    </div>
  )
}
