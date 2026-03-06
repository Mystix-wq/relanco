'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const C = {
  navy: '#0D1B2A', coral: '#E05C3A', bg: '#F5F3EE',
  card: '#FFFFFF', border: '#E8E4DC', text: '#1B2A4A',
  mid: '#5A6478', dim: '#9BA3B4', green: '#1A7A5B',
  amber: '#B86E00',
}

const STEPS = [
  { id: 1, title: 'Bienvenue sur Relanco 🎉', subtitle: 'Votre outil de suivi acheteurs est prêt.' },
  { id: 2, title: 'Ajoutez votre premier acheteur', subtitle: 'En 30 secondes, créez votre premier contact.' },
  { id: 3, title: 'Vous êtes prêt !', subtitle: 'Votre pipeline démarre maintenant.' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [agentName, setAgentName] = useState('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', budget: '', zones: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setAgentName(user.user_metadata?.full_name?.split(' ')[0] || 'vous')
    })
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const skip = () => { window.location.href = '/dashboard' }

  const createBuyer = async () => {
    if (!form.firstName || !form.lastName) { window.location.href = '/dashboard'; return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('buyers').insert({
        user_id: user.id,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        budget: Number(form.budget) || 0,
        zones: form.zones.split(',').map((z: string) => z.trim()).filter(Boolean),
        status: 'warm',
        rooms: 3, min_surface: 0, max_surface: 200,
        source: 'Autre', notes: '', phone: '',
      })
    }
    setLoading(false)
    setStep(3)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step >= s.id ? C.coral : C.border, color: step >= s.id ? '#fff' : C.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'all 0.3s' }}>
                {step > s.id ? '✓' : s.id}
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 60, height: 2, background: step > s.id ? C.coral : C.border, transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <div style={{ background: C.card, borderRadius: 24, padding: 48, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: `1px solid ${C.border}` }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🏡</div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: C.text, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                Bonjour {agentName} !
              </h1>
              <p style={{ fontSize: 16, color: C.mid, marginBottom: 40, lineHeight: 1.7 }}>
                Relanco va vous aider à ne plus jamais perdre un acheteur de vue. Voyons ensemble comment ça fonctionne.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40, textAlign: 'left' }}>
                {[
                  { icon: '👥', title: 'Vos acheteurs', desc: 'Créez une fiche pour chaque acheteur avec ses critères et budget.' },
                  { icon: '🏠', title: 'Vos visites', desc: 'Enregistrez chaque visite et la réaction de l\'acheteur.' },
                  { icon: '✦', title: 'Le suivi IA', desc: 'Relanco génère le message parfait et l\'envoie directement par email.' },
                ].map(f => (
                  <div key={f.title} style={{ display: 'flex', gap: 16, padding: '16px 20px', background: C.bg, borderRadius: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: C.coral + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep(2)} style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(224,92,58,0.35)', width: '100%' }}>
                Commencer →
              </button>
              <button onClick={skip} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', marginTop: 14, fontSize: 13 }}>
                Passer et aller au tableau de bord
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>👤</div>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>Votre premier acheteur</h1>
                <p style={{ fontSize: 14, color: C.mid, margin: 0 }}>Pensez à un acheteur que vous suivez en ce moment.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['firstName','Prénom *','Sophie'],['lastName','Nom *','Durand']].map(([k,l,p]) => (
                    <div key={k}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>{l}</label>
                      <input value={form[k as keyof typeof form]} onChange={e => set(k, e.target.value)} placeholder={p}
                        style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sophie@email.com"
                    style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Budget (€)</label>
                    <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="450000"
                      style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Zones</label>
                    <input value={form.zones} onChange={e => set('zones', e.target.value)} placeholder="Paris 11e, Vincennes"
                      style={{ width: '100%', background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none' }}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
                  </div>
                </div>

                <button onClick={createBuyer} disabled={loading}
                  style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(224,92,58,0.3)', marginTop: 8, width: '100%' }}>
                  {loading ? 'Création...' : 'Créer et continuer →'}
                </button>
                <button onClick={skip} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', fontSize: 13, textAlign: 'center' }}>
                  Je ferai ça plus tard
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🎯</div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>Vous êtes prêt !</h1>
              <p style={{ fontSize: 15, color: C.mid, marginBottom: 40, lineHeight: 1.7 }}>
                Votre espace Relanco est configuré. Commencez à enregistrer vos visites et laissez l'IA vous aider à relancer.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
                {['✓ Compte créé', '✓ Premier acheteur ajouté', '✓ Prêt à générer des messages IA'].map(t => (
                  <div key={t} style={{ padding: '12px 20px', background: '#E8F5F0', borderRadius: 10, fontSize: 14, color: C.green, fontWeight: 600 }}>{t}</div>
                ))}
              </div>
              <button onClick={skip} style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 36px', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(224,92,58,0.35)', width: '100%' }}>
                Aller sur mon tableau de bord →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
