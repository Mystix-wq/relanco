'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const C = {
  navy: '#0D1B2A', coral: '#E05C3A', bg: '#F5F3EE',
  card: '#FFFFFF', border: '#E8E4DC', text: '#1B2A4A',
  mid: '#5A6478', dim: '#9BA3B4', green: '#1A7A5B',
}

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', agency: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const register = async () => {
    if (!form.fullName || !form.email || !form.password) { setError('Remplissez tous les champs obligatoires.'); return }
    if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, agency_name: form.agency } }
    })
    if (err) { setError(err.message); setLoading(false); return }
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (!loginErr) { window.location.href = '/onboarding' }
    else { window.location.href = '/login' }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Left panel */}
      <div style={{ width: '45%', background: C.navy, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: C.coral, opacity: 0.06 }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: '#ffffff', opacity: 0.03 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, background: C.coral, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(224,92,58,0.4)' }}>🏡</div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Relanco</span>
        </div>

        <div>
          <div style={{ fontSize: 13, color: C.coral, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Essai gratuit · Sans CB</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 40, fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Prêt à ne plus<br />perdre un acheteur ?
          </h2>
          <p style={{ fontSize: 16, color: '#ffffff66', lineHeight: 1.7, margin: 0 }}>
            Rejoignez les agents qui utilisent Relanco pour suivre leurs acheteurs et déclencher les bonnes relances au bon moment.
          </p>

          <div style={{ marginTop: 48 }}>
            <div style={{ fontSize: 12, color: '#ffffff40', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Ce que vous allez pouvoir faire</div>
            {[
              '✓ Ajouter vos acheteurs en 30 secondes',
              '✓ Enregistrer chaque visite avec la réaction',
              '✓ Générer un email de suivi en un clic',
              '✓ Voir qui relancer en priorité',
            ].map(t => <div key={t} style={{ fontSize: 14, color: '#ffffffaa', marginBottom: 10, fontWeight: 500 }}>{t}</div>)}
          </div>
        </div>

        <div style={{ fontSize: 12, color: '#ffffff30' }}>© 2025 Relanco · Tous droits réservés</div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Créer votre compte</h1>
            <p style={{ fontSize: 15, color: C.dim, margin: 0 }}>Configuré en moins de 2 minutes.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Prénom & Nom *</label>
                <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Sophie Durand"
                  style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Agence</label>
                <input type="text" value={form.agency} onChange={e => set('agency', e.target.value)} placeholder="Orpi Paris 11e"
                  style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Email professionnel *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sophie@agence.fr"
                style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Mot de passe *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="6 caractères minimum"
                onKeyDown={e => e.key === 'Enter' && register()}
                style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#C0392B' }}>
                ⚠ {error}
              </div>
            )}

            <button onClick={register} disabled={loading}
              style={{ background: loading ? C.mid : C.coral, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(224,92,58,0.35)', marginTop: 4 }}>
              {loading ? 'Création...' : 'Créer mon compte →'}
            </button>

            <p style={{ fontSize: 12, color: C.dim, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              En créant un compte, vous acceptez nos conditions d'utilisation.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 28, padding: '24px 0', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, color: C.dim }}>Déjà un compte ? </span>
            <a href="/login" style={{ fontSize: 14, color: C.coral, fontWeight: 700, textDecoration: 'none' }}>Se connecter</a>
          </div>
        </div>
      </div>
    </div>
  )
}
