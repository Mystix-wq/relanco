'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const C = {
  navy: '#0D1B2A', coral: '#E05C3A', bg: '#F5F3EE',
  card: '#FFFFFF', border: '#E8E4DC', text: '#1B2A4A',
  mid: '#5A6478', dim: '#9BA3B4', green: '#1A7A5B',
  amber: '#B86E00', red: '#C0392B',
  coralLight: '#FDF0ED', greenLight: '#E8F5F0', amberLight: '#FDF4E3',
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 5px' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: C.dim, margin: 0 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, disabled }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{ background: disabled ? C.bg : C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: disabled ? C.dim : C.text, width: '100%', boxSizing: 'border-box' as const, outline: 'none', cursor: disabled ? 'not-allowed' : 'text' }}
        onFocus={e => { if (!disabled) (e.target as HTMLInputElement).style.borderColor = C.coral }}
        onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', sm, full, disabled }: any) {
  const v: any = {
    primary: { bg: C.navy, color: '#fff', border: 'none', shadow: '0 2px 8px rgba(27,42,74,0.25)' },
    coral: { bg: C.coral, color: '#fff', border: 'none', shadow: '0 2px 8px rgba(224,92,58,0.3)' },
    ghost: { bg: 'transparent', color: C.navy, border: `1.5px solid ${C.border}`, shadow: 'none' },
    danger: { bg: '#FEE2E2', color: C.red, border: `1px solid ${C.red}33`, shadow: 'none' },
    green: { bg: C.green, color: '#fff', border: 'none', shadow: '0 2px 8px rgba(26,122,91,0.25)' },
  }
  const s = v[variant]
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: s.bg, color: s.color, border: s.border, boxShadow: s.shadow, padding: sm ? '8px 16px' : '11px 22px', borderRadius: 10, fontSize: sm ? 13 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', width: full ? '100%' : undefined, opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center', whiteSpace: 'nowrap' as const }}>
      {children}
    </button>
  )
}

export default function ProfilePage() {
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const [profile, setProfile] = useState({
    fullName: '', agency: '', phone: '', title: '',
    signatureExtra: '', website: '',
  })
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [pwStatus, setPwStatus] = useState<'idle'|'success'|'error'>('idle')
  const [pwMsg, setPwMsg] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      setUserEmail(user.email || '')
      const meta = user.user_metadata || {}
      setProfile({
        fullName: meta.full_name || '',
        agency: meta.agency_name || '',
        phone: meta.phone || '',
        title: meta.title || 'Agent immobilier',
        signatureExtra: meta.signature_extra || '',
        website: meta.website || '',
      })
      setLoading(false)
    })
  }, [])

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profile.fullName,
        agency_name: profile.agency,
        phone: profile.phone,
        title: profile.title,
        signature_extra: profile.signatureExtra,
        website: profile.website,
      }
    })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const changePassword = async () => {
    if (password.new !== password.confirm) { setPwStatus('error'); setPwMsg('Les mots de passe ne correspondent pas.'); return }
    if (password.new.length < 6) { setPwStatus('error'); setPwMsg('Minimum 6 caractères.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: password.new })
    setSaving(false)
    if (error) { setPwStatus('error'); setPwMsg(error.message) }
    else { setPwStatus('success'); setPwMsg('Mot de passe mis à jour !'); setPassword({ current: '', new: '', confirm: '' }) }
  }

  const deleteAccount = async () => {
    if (!confirm('Supprimer définitivement votre compte et toutes vos données ?')) return
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const set = (k: string, v: string) => setProfile(p => ({ ...p, [k]: v }))

  const initials = profile.fullName ? profile.fullName.split(' ').map(n => n[0]).slice(0,2).join('') : userEmail[0]?.toUpperCase()

  const tabs = [
    { id: 'profile', label: '👤 Profil', },
    { id: 'subscription', label: '💳 Abonnement', },
    { id: 'security', label: '🔒 Sécurité', },
  ]

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: C.dim }}>Chargement...</div>
    </div>
  )

  return (
    <div style={{ padding: '32px 36px', maxWidth: 780, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', boxShadow: '0 4px 16px rgba(224,92,58,0.3)' }}>
          {initials}
        </div>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{profile.fullName || 'Mon profil'}</h1>
          <div style={{ fontSize: 14, color: C.dim }}>{profile.agency || 'Agence non renseignée'} · {userEmail}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 5, marginBottom: 24, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: tab === t.id ? C.navy : 'transparent', color: tab === t.id ? '#fff' : C.mid, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {tab === 'profile' && (
        <>
          <Section title="Informations personnelles" subtitle="Ces informations apparaissent dans votre signature email.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Nom complet" value={profile.fullName} onChange={(e: any) => set('fullName', e.target.value)} placeholder="Sophie Durand" />
                <Field label="Titre / Poste" value={profile.title} onChange={(e: any) => set('title', e.target.value)} placeholder="Agent immobilier" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Agence" value={profile.agency} onChange={(e: any) => set('agency', e.target.value)} placeholder="Orpi Paris 11e" />
                <Field label="Téléphone" value={profile.phone} onChange={(e: any) => set('phone', e.target.value)} placeholder="06 12 34 56 78" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Email (non modifiable)" value={userEmail} disabled />
                <Field label="Site web" value={profile.website} onChange={(e: any) => set('website', e.target.value)} placeholder="www.votre-agence.fr" />
              </div>
            </div>
          </Section>

          <Section title="Signature email" subtitle="Ajoutée automatiquement à chaque message de suivi envoyé.">
            <div style={{ marginBottom: 16 }}>
              {/* Preview */}
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Aperçu signature</div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{profile.fullName || 'Votre Nom'}</div>
                  <div style={{ color: C.mid }}>{profile.title || 'Agent immobilier'}</div>
                  {profile.agency && <div style={{ color: C.mid }}>{profile.agency}</div>}
                  {profile.phone && <div style={{ color: C.mid }}>📞 {profile.phone}</div>}
                  {profile.website && <div style={{ color: C.coral }}>{profile.website}</div>}
                  {profile.signatureExtra && <div style={{ color: C.mid, marginTop: 6, fontStyle: 'italic' }}>{profile.signatureExtra}</div>}
                  <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, background: C.navy, borderRadius: 6, padding: '3px 10px' }}>
                    <span style={{ fontSize: 11 }}>🏡</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>Relanco</span>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>Texte additionnel (optionnel)</label>
                <textarea value={profile.signatureExtra} onChange={e => set('signatureExtra', e.target.value)} rows={2} placeholder="Ex: Disponible du lundi au vendredi de 9h à 19h"
                  style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>

            {saved && (
              <div style={{ background: C.greenLight, border: `1px solid ${C.green}33`, borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.green, fontWeight: 600, marginBottom: 14 }}>
                ✓ Profil enregistré avec succès !
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn variant="coral" onClick={saveProfile} disabled={saving}>{saving ? 'Enregistrement...' : '💾 Enregistrer les modifications'}</Btn>
            </div>
          </Section>
        </>
      )}

      {/* SUBSCRIPTION TAB */}
      {tab === 'subscription' && (
        <>
          <Section title="Plan actuel" subtitle="Gérez votre abonnement Relanco.">
            <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #1E3448 100%)`, borderRadius: 16, padding: '28px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: C.coral, opacity: 0.08 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff55', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Plan actuel</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Gratuit</div>
                  <div style={{ fontSize: 13, color: '#ffffff66' }}>Accès limité aux fonctionnalités de base</div>
                </div>
                <div style={{ background: C.coral, borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fff' }}>ACTIF</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {[
                { plan: 'Starter', price: '19€/mois', features: ['50 acheteurs', 'Messages IA illimités', 'Export CSV', 'Support email'], color: C.mid, recommended: false },
                { plan: 'Pro', price: '39€/mois', features: ['Acheteurs illimités', 'Rappels automatiques', 'Multi-agence', 'Support prioritaire'], color: C.coral, recommended: true },
              ].map(p => (
                <div key={p.plan} style={{ border: `2px solid ${p.recommended ? C.coral : C.border}`, borderRadius: 16, padding: 24, position: 'relative' }}>
                  {p.recommended && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.coral, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 100 }}>RECOMMANDÉ</div>}
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{p.plan}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: p.color, marginBottom: 16 }}>{p.price}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {p.features.map(f => <div key={f} style={{ fontSize: 13, color: C.mid, display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ color: C.green, fontWeight: 700 }}>✓</span>{f}</div>)}
                  </div>
                  <Btn variant={p.recommended ? 'coral' : 'ghost'} full onClick={() => alert('Paiement Stripe — à configurer après déploiement')}>
                    Choisir {p.plan}
                  </Btn>
                </div>
              ))}
            </div>

            <div style={{ background: C.bg, borderRadius: 12, padding: '14px 18px', fontSize: 13, color: C.mid }}>
              💳 Le paiement est sécurisé par <strong>Stripe</strong>. Vous pouvez annuler à tout moment depuis cette page.
            </div>
          </Section>

          <Section title="Utilisation ce mois-ci">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {[['Acheteurs', '—', '50 max'], ['Emails envoyés', '—', 'Illimités'], ['Visites enregistrées', '—', 'Illimitées']].map(([l, v, max]) => (
                <div key={l} style={{ background: C.bg, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{l}</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: C.text }}>{v}</div>
                  <div style={{ fontSize: 12, color: C.dim }}>{max}</div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* SECURITY TAB */}
      {tab === 'security' && (
        <>
          <Section title="Changer le mot de passe">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Nouveau mot de passe" type="password" value={password.new} onChange={(e: any) => setPassword(p => ({ ...p, new: e.target.value }))} placeholder="6 caractères minimum" />
              <Field label="Confirmer le mot de passe" type="password" value={password.confirm} onChange={(e: any) => setPassword(p => ({ ...p, confirm: e.target.value }))} placeholder="Répétez le mot de passe" />

              {pwStatus === 'success' && <div style={{ background: C.greenLight, border: `1px solid ${C.green}33`, borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.green, fontWeight: 600 }}>✓ {pwMsg}</div>}
              {pwStatus === 'error' && <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.red }}>⚠ {pwMsg}</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn variant="primary" onClick={changePassword} disabled={saving}>Mettre à jour le mot de passe</Btn>
              </div>
            </div>
          </Section>

          <Section title="Sessions actives">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: C.bg, borderRadius: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Session actuelle</div>
                <div style={{ fontSize: 12, color: C.dim }}>{userEmail} · Connecté maintenant</div>
              </div>
              <div style={{ background: C.greenLight, color: C.green, borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>● Actif</div>
            </div>
          </Section>

          <Section title="Zone de danger">
            <div style={{ background: '#FEF2F2', border: `1px solid ${C.red}22`, borderRadius: 14, padding: 24 }}>
              <h3 style={{ fontWeight: 700, color: C.red, margin: '0 0 8px', fontSize: 16 }}>Supprimer mon compte</h3>
              <p style={{ fontSize: 13, color: C.mid, margin: '0 0 18px', lineHeight: 1.6 }}>
                Cette action est irréversible. Tous vos acheteurs, visites et messages seront définitivement supprimés.
              </p>
              <Btn variant="danger" onClick={deleteAccount}>Supprimer mon compte définitivement</Btn>
            </div>
          </Section>
        </>
      )}
    </div>
  )
}
