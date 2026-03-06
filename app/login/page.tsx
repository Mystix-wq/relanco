'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const C = {
  navy: '#0D1B2A', coral: '#E05C3A', bg: '#F5F3EE',
  card: '#FFFFFF', border: '#E8E4DC', text: '#1B2A4A',
  mid: '#5A6478', dim: '#9BA3B4',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const login = async () => {
    if (!email || !password) { setError('Remplissez tous les champs.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Left panel */}
      <div style={{ width: '45%', background: C.navy, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px', position: 'relative', overflow: 'hidden' }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: C.coral, opacity: 0.06 }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: '#ffffff', opacity: 0.03 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: C.coral, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(224,92,58,0.4)' }}>🏡</div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Relanco</span>
        </div>

        <div>
          <div style={{ fontSize: 13, color: C.coral, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Pour les agents immobiliers</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Relancez vos acheteurs<br />au bon moment.
          </h2>
          <p style={{ fontSize: 16, color: '#ffffff66', lineHeight: 1.7, margin: 0 }}>
            Suivez chaque visite, générez des messages personnalisés avec l'IA, et ne laissez plus aucun acheteur sans réponse.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 48 }}>
            {[
              { icon: '🎯', text: 'Score de priorité automatique' },
              { icon: '✦', text: 'Messages IA personnalisés' },
              { icon: '📧', text: 'Envoi d\'email en un clic' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffffff10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                <span style={{ fontSize: 14, color: '#ffffffaa', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#ffffff30' }}>© 2025 Relanco · Tous droits réservés</div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Bon retour 👋</h1>
            <p style={{ fontSize: 15, color: C.dim, margin: 0 }}>Connectez-vous à votre espace agent.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Adresse email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@agence.fr"
                onKeyDown={e => e.key === 'Enter' && login()}
                style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '13px 16px', fontSize: 15, color: C.text, boxSizing: 'border-box', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && login()}
                style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '13px 16px', fontSize: 15, color: C.text, boxSizing: 'border-box', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚠ {error}
              </div>
            )}

            <button onClick={login} disabled={loading}
              style={{ background: loading ? C.mid : C.coral, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(224,92,58,0.35)', marginTop: 4, letterSpacing: '-0.01em' }}>
              {loading ? 'Connexion...' : 'Se connecter →'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 32, padding: '24px 0', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, color: C.dim }}>Pas encore de compte ? </span>
            <a href="/register" style={{ fontSize: 14, color: C.coral, fontWeight: 700, textDecoration: 'none' }}>Créer un compte</a>
          </div>
        </div>
      </div>
    </div>
  )
}
