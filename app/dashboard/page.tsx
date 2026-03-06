'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Visit = {
  id: string; buyer_id: string; date: string; address: string; ref: string;
  price: number; surface: number; rooms: number; reaction: 'positive' | 'neutral' | 'negative';
  notes: string; followup_sent: boolean; created_at: string;
}
type Buyer = {
  id: string; user_id: string; first_name: string; last_name: string;
  email: string; phone: string; budget: number; min_surface: number;
  max_surface: number; rooms: number; zones: string[]; source: string;
  status: 'hot' | 'warm' | 'cold'; notes: string; created_at: string;
  visits: Visit[];
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  sidebar: '#0D1B2A',
  sidebarHover: '#162436',
  sidebarActive: '#1E3448',
  navy: '#1B2A4A',
  coral: '#E05C3A',
  coralLight: '#FDF0ED',
  green: '#1A7A5B',
  greenLight: '#E8F5F0',
  amber: '#B86E00',
  amberLight: '#FDF4E3',
  red: '#C0392B',
  bg: '#F5F3EE',
  card: '#FFFFFF',
  border: '#E8E4DC',
  text: '#1B2A4A',
  mid: '#5A6478',
  dim: '#9BA3B4',
  accent: '#E05C3A',
}

const REACTIONS = {
  positive: { label: 'Coup de cœur', icon: '❤️', color: C.green, bg: C.greenLight },
  neutral: { label: 'Intéressé', icon: '🤔', color: C.amber, bg: C.amberLight },
  negative: { label: 'Non retenu', icon: '✕', color: C.red, bg: '#FEE2E2' },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(n: number) { return new Intl.NumberFormat('fr-FR').format(n) + ' €' }
function daysAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (days === 0) return "aujourd'hui"; if (days === 1) return 'hier'; return `il y a ${days}j`
}

function calcScore(buyer: Buyer): number {
  let score = 50
  const sorted = [...(buyer.visits || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const lastVisit = sorted[0]
  if (lastVisit) {
    const days = Math.floor((Date.now() - new Date(lastVisit.date).getTime()) / 86400000)
    if (lastVisit.reaction === 'positive') score += 30
    else if (lastVisit.reaction === 'neutral') score += 10
    else score -= 10
    if (days < 7) score += 20; else if (days > 30) score -= 20
  } else score -= 30
  score += (buyer.visits?.filter(v => !v.followup_sent).length || 0) * 15
  if (buyer.status === 'hot') score += 20; else if (buyer.status === 'cold') score -= 20
  return Math.max(0, Math.min(100, score))
}

// ─── ATOMS ───────────────────────────────────────────────────────────────────
function Avatar({ firstName, lastName, size = 40 }: { firstName: string; lastName: string; size?: number }) {
  const hue = ((firstName.charCodeAt(0) + lastName.charCodeAt(0)) * 37) % 360
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `hsl(${hue},45%,88%)`, border: `2px solid hsl(${hue},45%,75%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, color: `hsl(${hue},40%,30%)`, flexShrink: 0, letterSpacing: '-0.5px' }}>
      {firstName[0]}{lastName[0]}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const s = {
    hot: { label: 'Chaud', color: C.coral, bg: C.coralLight, dot: C.coral },
    warm: { label: 'Tiède', color: C.amber, bg: C.amberLight, dot: C.amber },
    cold: { label: 'Froid', color: C.dim, bg: '#F0EDE6', dot: C.dim },
  }[status] || { label: status, color: C.dim, bg: '#F0EDE6', dot: C.dim }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: s.bg, color: s.color, borderRadius: 100, padding: '4px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label.toUpperCase()}
    </span>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? C.coral : score >= 50 ? C.amber : C.dim
  const r = 16; const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={22} cy={22} r={r} fill="none" stroke={color + '22'} strokeWidth={3} />
        <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{score}</span>
      </div>
    </div>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,27,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: C.card, borderRadius: 20, padding: 36, width: '100%', maxWidth: wide ? 780 : 560, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(13,27,42,0.25)', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.bg, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: C.mid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, width: '100%', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s' }}
        onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.coral}
        onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
    </div>
  )
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, width: '100%', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Btn({ children, onClick, variant = 'primary', sm, full, disabled }: any) {
  const v: any = {
    primary: { bg: C.navy, color: '#fff', border: 'none', shadow: '0 2px 8px rgba(27,42,74,0.3)' },
    coral: { bg: C.coral, color: '#fff', border: 'none', shadow: '0 2px 8px rgba(224,92,58,0.35)' },
    ghost: { bg: 'transparent', color: C.navy, border: `1.5px solid ${C.border}`, shadow: 'none' },
    danger: { bg: '#FEE2E2', color: C.red, border: `1px solid ${C.red}33`, shadow: 'none' },
    green: { bg: C.green, color: '#fff', border: 'none', shadow: '0 2px 8px rgba(26,122,91,0.3)' },
  }
  const s = v[variant]
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: s.bg, color: s.color, border: s.border, boxShadow: s.shadow, padding: sm ? '7px 15px' : '11px 22px', borderRadius: 10, fontSize: sm ? 12 : 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', width: full ? '100%' : undefined, opacity: disabled ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center', whiteSpace: 'nowrap', transition: 'opacity 0.15s, transform 0.1s', letterSpacing: '-0.01em' }}>
      {children}
    </button>
  )
}

// ─── BUYER FORM ──────────────────────────────────────────────────────────────
function BuyerForm({ title, initial, onClose, onSave }: { title: string; initial?: Partial<Buyer>; onClose: () => void; onSave: (b: any) => Promise<void> }) {
  const [f, setF] = useState({ firstName: initial?.first_name || '', lastName: initial?.last_name || '', email: initial?.email || '', phone: initial?.phone || '', budget: String(initial?.budget || ''), minSurface: String(initial?.min_surface || ''), maxSurface: String(initial?.max_surface || ''), rooms: String(initial?.rooms || '3'), zones: (initial?.zones || []).join(', '), source: initial?.source || 'SeLoger', notes: initial?.notes || '', status: initial?.status || 'warm' })
  const [loading, setLoading] = useState(false)
  const s = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))
  const submit = async () => {
    if (!f.firstName || !f.lastName) return
    setLoading(true)
    await onSave({ first_name: f.firstName, last_name: f.lastName, email: f.email, phone: f.phone, budget: Number(f.budget), min_surface: Number(f.minSurface), max_surface: Number(f.maxSurface), rooms: Number(f.rooms), zones: f.zones.split(',').map((z: string) => z.trim()).filter(Boolean), source: f.source, notes: f.notes, status: f.status })
    setLoading(false); onClose()
  }
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Prénom *" value={f.firstName} onChange={(e: any) => s('firstName', e.target.value)} placeholder="Sophie" />
          <Field label="Nom *" value={f.lastName} onChange={(e: any) => s('lastName', e.target.value)} placeholder="Durand" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Email" type="email" value={f.email} onChange={(e: any) => s('email', e.target.value)} placeholder="sophie@email.com" />
          <Field label="Téléphone" value={f.phone} onChange={(e: any) => s('phone', e.target.value)} placeholder="06 12 34 56 78" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Budget (€)" type="number" value={f.budget} onChange={(e: any) => s('budget', e.target.value)} placeholder="450000" />
          <Field label="Surface min m²" type="number" value={f.minSurface} onChange={(e: any) => s('minSurface', e.target.value)} placeholder="80" />
          <Field label="Surface max m²" type="number" value={f.maxSurface} onChange={(e: any) => s('maxSurface', e.target.value)} placeholder="120" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Select label="Pièces min" value={f.rooms} onChange={(e: any) => s('rooms', e.target.value)} options={[2,3,4,5,6].map(n => ({ value: n, label: `${n} pièces` }))} />
          <Select label="Source" value={f.source} onChange={(e: any) => s('source', e.target.value)} options={['SeLoger','Leboncoin','Recommandation','Réseau','Autre'].map(x => ({ value: x, label: x }))} />
          <Select label="Statut" value={f.status} onChange={(e: any) => s('status', e.target.value)} options={[{value:'hot',label:'🔥 Chaud'},{value:'warm',label:'🌡 Tiède'},{value:'cold',label:'❄️ Froid'}]} />
        </div>
        <Field label="Zones (séparées par virgule)" value={f.zones} onChange={(e: any) => s('zones', e.target.value)} placeholder="Paris 11e, Vincennes" />
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Notes</label>
          <textarea value={f.notes} onChange={e => s('notes', e.target.value)} rows={3} placeholder="Informations utiles..." style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="coral" onClick={submit} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ─── VISIT FORM ───────────────────────────────────────────────────────────────
function VisitForm({ title, buyer, initial, onClose, onSave }: { title: string; buyer: Buyer; initial?: Partial<Visit>; onClose: () => void; onSave: (v: any) => Promise<void> }) {
  const [f, setF] = useState({ date: initial?.date || new Date().toISOString().split('T')[0], address: initial?.address || '', ref: initial?.ref || '', price: String(initial?.price || ''), surface: String(initial?.surface || ''), rooms: String(initial?.rooms || '3'), reaction: initial?.reaction || 'neutral', notes: initial?.notes || '' })
  const [loading, setLoading] = useState(false)
  const s = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))
  const submit = async () => {
    if (!f.address) return; setLoading(true)
    await onSave({ buyer_id: buyer.id, date: f.date, address: f.address, ref: f.ref, price: Number(f.price), surface: Number(f.surface), rooms: Number(f.rooms), reaction: f.reaction, notes: f.notes })
    setLoading(false); onClose()
  }
  return (
    <Modal title={`${title} — ${buyer.first_name} ${buyer.last_name}`} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Date *" type="date" value={f.date} onChange={(e: any) => s('date', e.target.value)} />
          <Field label="Référence" value={f.ref} onChange={(e: any) => s('ref', e.target.value)} placeholder="APP-2312" />
        </div>
        <Field label="Adresse *" value={f.address} onChange={(e: any) => s('address', e.target.value)} placeholder="8 rue de la Plaine, Vincennes" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Prix (€)" type="number" value={f.price} onChange={(e: any) => s('price', e.target.value)} placeholder="448000" />
          <Field label="Surface m²" type="number" value={f.surface} onChange={(e: any) => s('surface', e.target.value)} placeholder="92" />
          <Select label="Pièces" value={f.rooms} onChange={(e: any) => s('rooms', e.target.value)} options={[2,3,4,5,6].map(n => ({ value: n, label: `${n}P` }))} />
        </div>
        <Select label="Réaction" value={f.reaction} onChange={(e: any) => s('reaction', e.target.value)} options={[{value:'positive',label:'❤️ Coup de cœur'},{value:'neutral',label:'🤔 Intéressé'},{value:'negative',label:'✕ Non retenu'}]} />
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Notes</label>
          <textarea value={f.notes} onChange={e => s('notes', e.target.value)} rows={3} placeholder="A aimé la luminosité mais..." style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
          <Btn variant="coral" onClick={submit} disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

// ─── AI MODAL ────────────────────────────────────────────────────────────────
function AIModal({ buyer, visit, onClose, onMarkSent, agentName, agentEmail }: { buyer: Buyer; visit: Visit; onClose: () => void; onMarkSent: () => Promise<void>; agentName?: string; agentEmail?: string }) {
  const [msg, setMsg] = useState('')
  const [subject, setSubject] = useState(`Suivi de votre visite — ${visit.address}`)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(visit.followup_sent)
  const [emailStatus, setEmailStatus] = useState<'idle'|'success'|'error'>('idle')

  const fallback = () => {
    const sign = `\n\nBien cordialement,\n${agentName || 'Votre agent'}`
    if (visit.reaction === 'positive') return `Bonjour ${buyer.first_name},\n\nMerci pour cette visite au ${visit.address} — je suis ravi(e) que ce bien vous ait autant plu ! Vu votre enthousiasme, je vous conseille de ne pas trop attendre.${sign}`
    if (visit.reaction === 'neutral') return `Bonjour ${buyer.first_name},\n\nMerci pour la visite du ${visit.address}. J'ai bien noté vos remarques et continue mes recherches pour vous.${sign}`
    return `Bonjour ${buyer.first_name},\n\nMerci pour votre retour sur la visite du ${visit.address}. Je reste attentif(ve) aux nouvelles opportunités dans vos critères.${sign}`
  }

  const generate = async () => {
    setLoading(true); setMsg('')
    try {
      const res = await fetch('/api/generate-message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buyer, visit }) })
      const data = await res.json()
      setMsg(data.message || fallback())
    } catch { setMsg(fallback()) }
    setLoading(false)
  }

  const copy = () => { navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const sendEmail = async () => {
    if (!buyer.email || !msg) return
    setSending(true); setEmailStatus('idle')
    try {
      const res = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: buyer.email, subject, message: msg, fromName: agentName, fromEmail: agentEmail }) })
      const data = await res.json()
      if (data.success) { setEmailStatus('success'); await onMarkSent(); setSent(true) }
      else setEmailStatus('error')
    } catch { setEmailStatus('error') }
    setSending(false)
  }

  const r = REACTIONS[visit.reaction]

  return (
    <Modal title="✦ Message de suivi IA" onClose={onClose} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.bg, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Acheteur</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Avatar firstName={buyer.first_name} lastName={buyer.last_name} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{buyer.first_name} {buyer.last_name}</div>
                <div style={{ fontSize: 11, color: buyer.email ? C.dim : C.amber }}>{buyer.email || '⚠ Pas d\'email'}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.7 }}><strong>{fmt(buyer.budget)}</strong><br />{buyer.rooms}P · {buyer.min_surface}–{buyer.max_surface}m²</div>
          </div>
          <div style={{ background: C.bg, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Visite</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{visit.address}</div>
            <div style={{ fontSize: 12, color: C.dim, marginBottom: 10 }}>{visit.price ? fmt(visit.price) : ''} · {visit.surface}m² · {visit.date}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: r?.bg, borderRadius: 8, padding: '5px 10px' }}>
              <span>{r?.icon}</span>
              <span style={{ fontSize: 12, color: r?.color, fontWeight: 600 }}>{r?.label}</span>
            </div>
            {visit.notes && <div style={{ marginTop: 10, fontSize: 12, color: C.mid, fontStyle: 'italic', borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>"{visit.notes}"</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!msg && !loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: `linear-gradient(135deg, ${C.bg} 0%, #EDE9E0 100%)`, borderRadius: 16, textAlign: 'center', border: `1.5px dashed ${C.border}` }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.7 }}>✦</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Message personnalisé</div>
              <div style={{ fontSize: 13, color: C.mid, marginBottom: 22, maxWidth: 200 }}>L'IA rédige un message adapté à la réaction de l'acheteur.</div>
              <Btn variant="coral" onClick={generate}>✦ Générer le message</Btn>
            </div>
          )}
          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, background: C.bg, borderRadius: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>✦</div>
              <div style={{ fontSize: 13, color: C.mid }}>Rédaction en cours...</div>
            </div>
          )}
          {msg && (
            <>
              <Field label="Objet de l'email" value={subject} onChange={(e: any) => setSubject(e.target.value)} />
              <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={9}
                style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '16px', fontSize: 13, color: C.text, lineHeight: 1.8, resize: 'none', fontFamily: 'inherit' }} />
              {emailStatus === 'success' && <div style={{ background: C.greenLight, border: `1px solid ${C.green}33`, borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Email envoyé à {buyer.email} !</div>}
              {emailStatus === 'error' && <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.red }}>Erreur lors de l'envoi. Vérifiez votre clé Resend.</div>}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn variant="ghost" sm onClick={copy}>{copied ? '✓ Copié' : '📋 Copier'}</Btn>
                <Btn variant="ghost" sm onClick={generate}>↺ Régénérer</Btn>
                {!sent
                  ? buyer.email
                    ? <Btn variant="green" onClick={sendEmail} disabled={sending}>{sending ? 'Envoi...' : '📧 Envoyer l\'email'}</Btn>
                    : <span style={{ fontSize: 12, color: C.amber }}>⚠ Pas d'email renseigné</span>
                  : <span style={{ fontSize: 13, color: C.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>✓ Envoyé</span>
                }
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── MATCHING ────────────────────────────────────────────────────────────────
function MatchingModal({ buyers, onClose, onSelect }: { buyers: Buyer[]; onClose: () => void; onSelect: (b: Buyer) => void }) {
  const [p, setP] = useState({ price: '', surface: '', rooms: '3', zone: '' })
  const set = (k: string, v: string) => setP(x => ({ ...x, [k]: v }))
  const matches = buyers.filter(b => {
    const price = Number(p.price); const surface = Number(p.surface); const rooms = Number(p.rooms)
    return (!price || b.budget >= price * 0.9) && (!surface || (b.min_surface <= surface && b.max_surface >= surface)) && (!rooms || b.rooms <= rooms) && (!p.zone || b.zones?.some(z => z.toLowerCase().includes(p.zone.toLowerCase())))
  }).map(b => ({ ...b, score: calcScore(b) })).sort((a: any, b: any) => b.score - a.score)
  return (
    <Modal title="🔍 Matching bien → acheteurs" onClose={onClose} wide>
      <p style={{ fontSize: 13, color: C.mid, marginBottom: 20 }}>Entrez les caractéristiques d'un bien pour trouver les acheteurs qui correspondent.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        <Field label="Prix (€)" type="number" value={p.price} onChange={(e: any) => set('price', e.target.value)} placeholder="450000" />
        <Field label="Surface (m²)" type="number" value={p.surface} onChange={(e: any) => set('surface', e.target.value)} placeholder="90" />
        <Select label="Pièces" value={p.rooms} onChange={(e: any) => set('rooms', e.target.value)} options={[2,3,4,5,6].map(n => ({ value: n, label: `${n}P` }))} />
        <Field label="Zone" value={p.zone} onChange={(e: any) => set('zone', e.target.value)} placeholder="Paris 11e" />
      </div>
      {matches.length === 0
        ? <div style={{ textAlign: 'center', padding: 40, color: C.dim }}><div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div><div style={{ fontWeight: 600 }}>Aucun acheteur ne correspond</div></div>
        : <div>
            <div style={{ fontSize: 13, color: C.mid, marginBottom: 14 }}><strong style={{ color: C.coral }}>{matches.length}</strong> acheteur{matches.length > 1 ? 's' : ''} correspondent</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {matches.map((b: any) => (
                <div key={b.id} onClick={() => { onClose(); onSelect(b) }} style={{ background: C.bg, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, border: `1.5px solid ${C.border}`, transition: 'border-color 0.15s' }}>
                  <ScoreRing score={b.score} />
                  <Avatar firstName={b.first_name} lastName={b.last_name} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>{b.first_name} {b.last_name}</div>
                    <div style={{ fontSize: 12, color: C.dim }}>{fmt(b.budget)} · {b.rooms}P · {b.min_surface}–{b.max_surface}m²</div>
                  </div>
                  <StatusPill status={b.status} />
                </div>
              ))}
            </div>
          </div>
      }
    </Modal>
  )
}

// ─── KANBAN ──────────────────────────────────────────────────────────────────
function KanbanView({ buyers, onSelect, onStatusChange }: { buyers: Buyer[]; onSelect: (b: Buyer) => void; onStatusChange: (id: string, status: string) => Promise<void> }) {
  const dragRef = useRef<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const cols = [{ id: 'hot', label: 'Chauds', emoji: '🔥', color: C.coral, bg: '#FDF0ED' }, { id: 'warm', label: 'Tièdes', emoji: '🌡', color: C.amber, bg: '#FDF4E3' }, { id: 'cold', label: 'Froids', emoji: '❄️', color: C.dim, bg: '#F5F3EE' }]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
      {cols.map(col => {
        const colBuyers = buyers.filter(b => b.status === col.id).map(b => ({ ...b, score: calcScore(b) })).sort((a: any, b: any) => b.score - a.score)
        return (
          <div key={col.id} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragRef.current) { onStatusChange(dragRef.current, col.id); dragRef.current = null; setDragging(null) } }}
            style={{ background: col.bg, borderRadius: 18, padding: 16, minHeight: 420, border: `1.5px solid ${col.color}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 16 }}>{col.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: col.color }}>{col.label}</span>
              </div>
              <span style={{ background: col.color + '22', color: col.color, borderRadius: 100, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>{colBuyers.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {colBuyers.map((b: any) => {
                const lastV = [...(b.visits || [])].sort((a: any, c: any) => new Date(c.date).getTime() - new Date(a.date).getTime())[0]
                const pend = b.visits?.filter((v: any) => !v.followup_sent).length || 0
                return (
                  <div key={b.id} draggable onDragStart={() => { dragRef.current = b.id; setDragging(b.id) }} onDragEnd={() => setDragging(null)} onClick={() => onSelect(b)}
                    style={{ background: C.card, border: `1.5px solid ${pend > 0 ? C.amber + '66' : C.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'grab', boxShadow: dragging === b.id ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow 0.15s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Avatar firstName={b.first_name} lastName={b.last_name} size={34} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.first_name} {b.last_name}</div>
                        <div style={{ fontSize: 11, color: C.dim }}>{fmt(b.budget)}</div>
                      </div>
                      <ScoreRing score={b.score} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: C.dim }}>
                      <span>🏠 {b.visits?.length || 0}</span>
                      {lastV && <span>{REACTIONS[lastV.reaction as keyof typeof REACTIONS]?.icon} {daysAgo(lastV.date)}</span>}
                      {pend > 0 && <span style={{ color: C.amber, fontWeight: 700 }}>⚠ {pend}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function exportCSV(buyers: Buyer[]) {
  const headers = ['Prénom','Nom','Email','Téléphone','Budget','Surface min','Surface max','Pièces','Zones','Source','Statut','Nb visites','Suivis en attente']
  const rows = buyers.map(b => [b.first_name,b.last_name,b.email,b.phone,b.budget,b.min_surface,b.max_surface,b.rooms,(b.zones||[]).join('|'),b.source,b.status,b.visits?.length||0,b.visits?.filter(v=>!v.followup_sent).length||0])
  const csv = [headers,...rows].map(r=>r.map((c:any)=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href=url; a.download=`relanco_${new Date().toISOString().split('T')[0]}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ─── BUYER DETAIL ─────────────────────────────────────────────────────────────
function BuyerDetail({ buyer, onBack, onRefresh, agentName, agentEmail }: { buyer: Buyer; onBack: () => void; onRefresh: () => Promise<void>; agentName?: string; agentEmail?: string }) {
  const [showVisit, setShowVisit] = useState(false)
  const [editVisit, setEditVisit] = useState<Visit | null>(null)
  const [aiVisit, setAiVisit] = useState<Visit | null>(null)
  const [editBuyer, setEditBuyer] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const supabase = createClient()
  const score = calcScore(buyer)
  const pending = buyer.visits?.filter(v => !v.followup_sent).length || 0
  const sorted = [...(buyer.visits || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const addVisit = async (v: any) => { await supabase.from('visits').insert(v); await onRefresh() }
  const updateVisit = async (id: string, v: any) => { await supabase.from('visits').update(v).eq('id', id); await onRefresh() }
  const deleteVisit = async (id: string) => { if (!confirm('Supprimer cette visite ?')) return; await supabase.from('visits').delete().eq('id', id); await onRefresh() }
  const markSent = async (id: string) => { await supabase.from('visits').update({ followup_sent: true }).eq('id', id); await onRefresh() }
  const updateBuyer = async (data: any) => { await supabase.from('buyers').update(data).eq('id', buyer.id); await onRefresh() }
  const deleteBuyer = async () => { await supabase.from('visits').delete().eq('buyer_id', buyer.id); await supabase.from('buyers').delete().eq('id', buyer.id); onBack(); await onRefresh() }

  return (
    <div style={{ padding: '28px 36px', maxWidth: 920, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, fontSize: 13, fontWeight: 600 }}>
        ← Retour aux acheteurs
      </button>

      {/* Header card */}
      <div style={{ background: C.card, borderRadius: 20, padding: 30, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Avatar firstName={buyer.first_name} lastName={buyer.last_name} size={62} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>{buyer.first_name} {buyer.last_name}</h2>
                <ScoreRing score={score} />
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatusPill status={buyer.status} />
                {buyer.email && <span style={{ fontSize: 13, color: C.dim }}>✉ {buyer.email}</span>}
                {buyer.phone && <span style={{ fontSize: 13, color: C.dim }}>📞 {buyer.phone}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" sm onClick={() => setEditBuyer(true)}>✏️ Modifier</Btn>
            <Btn variant="danger" sm onClick={() => setConfirmDelete(true)}>🗑</Btn>
            <Btn variant="coral" sm onClick={() => setShowVisit(true)}>+ Visite</Btn>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[['Budget', fmt(buyer.budget)], ['Surface', `${buyer.min_surface}–${buyer.max_surface}m²`], ['Pièces', `${buyer.rooms}P`], ['Source', buyer.source]].map(([k,v]) => (
            <div key={k} style={{ background: C.bg, borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{v}</div>
            </div>
          ))}
        </div>
        {buyer.zones?.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {buyer.zones.map(z => <span key={z} style={{ background: C.navy + '10', color: C.navy, border: `1px solid ${C.navy}18`, borderRadius: 100, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>📍 {z}</span>)}
          </div>
        )}
        {buyer.notes && <div style={{ marginTop: 14, padding: '12px 16px', background: C.bg, borderRadius: 12, fontSize: 13, color: C.mid, fontStyle: 'italic' }}>"{buyer.notes}"</div>}
      </div>

      {pending > 0 && (
        <div style={{ background: C.amberLight, border: `1px solid ${C.amber}33`, borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 13, color: C.amber, fontWeight: 700 }}>{pending} message{pending>1?'s':''} de suivi en attente d'envoi</span>
        </div>
      )}

      <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 16 }}>Visites ({buyer.visits?.length || 0})</h3>

      {sorted.length === 0
        ? <div style={{ background: C.card, border: `1.5px dashed ${C.border}`, borderRadius: 18, padding: 56, textAlign: 'center' }}><div style={{ fontSize: 40, marginBottom: 14 }}>🏠</div><div style={{ fontWeight: 600, marginBottom: 16 }}>Aucune visite enregistrée</div><Btn variant="coral" onClick={() => setShowVisit(true)}>+ Ajouter une visite</Btn></div>
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sorted.map(visit => {
              const r = REACTIONS[visit.reaction as keyof typeof REACTIONS]
              return (
                <div key={visit.id} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: r?.bg, borderRadius: 8, padding: '4px 10px' }}>
                          <span>{r?.icon}</span>
                          <span style={{ fontSize: 11, color: r?.color, fontWeight: 700 }}>{r?.label}</span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{visit.address}</span>
                        {visit.ref && <span style={{ fontSize: 11, fontFamily: 'monospace', color: C.dim, background: C.bg, padding: '2px 8px', borderRadius: 5 }}>{visit.ref}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: C.mid }}>{visit.price ? fmt(visit.price) : '—'}</span>
                        <span style={{ fontSize: 13, color: C.mid }}>{visit.surface}m²</span>
                        <span style={{ fontSize: 13, color: C.mid }}>{visit.rooms}P</span>
                        <span style={{ fontSize: 13, color: C.dim }}>{visit.date}</span>
                      </div>
                      {visit.notes && <div style={{ marginTop: 8, fontSize: 13, color: C.mid, fontStyle: 'italic' }}>"{visit.notes}"</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginLeft: 20 }}>
                      {visit.followup_sent
                        ? <span style={{ fontSize: 12, color: C.green, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>✓ Suivi envoyé</span>
                        : <span style={{ fontSize: 12, color: C.amber, fontWeight: 600 }}>⏳ Suivi en attente</span>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn variant="ghost" sm onClick={() => setEditVisit(visit)}>✏️</Btn>
                        <Btn variant="danger" sm onClick={() => deleteVisit(visit.id)}>🗑</Btn>
                        <Btn variant={visit.followup_sent ? 'ghost' : 'coral'} sm onClick={() => setAiVisit(visit)}>{visit.followup_sent ? 'Voir' : '✦ Suivi IA'}</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {showVisit && <VisitForm title="Nouvelle visite" buyer={buyer} onClose={() => setShowVisit(false)} onSave={async v => { await addVisit(v); setShowVisit(false) }} />}
      {editVisit && <VisitForm title="Modifier la visite" buyer={buyer} initial={editVisit} onClose={() => setEditVisit(null)} onSave={async v => { await updateVisit(editVisit.id, v); setEditVisit(null) }} />}
      {aiVisit && <AIModal buyer={buyer} visit={aiVisit} onClose={() => setAiVisit(null)} onMarkSent={async () => { await markSent(aiVisit.id); setAiVisit(null) }} agentName={agentName} agentEmail={agentEmail} />}
      {editBuyer && <BuyerForm title="Modifier l'acheteur" initial={buyer} onClose={() => setEditBuyer(false)} onSave={async d => { await updateBuyer(d); setEditBuyer(false) }} />}
      {confirmDelete && (
        <Modal title="Supprimer l'acheteur" onClose={() => setConfirmDelete(false)}>
          <p style={{ color: C.mid, marginBottom: 28, fontSize: 14 }}>Cette action supprimera définitivement <strong>{buyer.first_name} {buyer.last_name}</strong> et toutes ses visites.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setConfirmDelete(false)}>Annuler</Btn>
            <Btn variant="danger" onClick={deleteBuyer}>Supprimer définitivement</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── DASHBOARD HOME ───────────────────────────────────────────────────────────
function DashboardHome({ buyers, onSelect, onRefresh }: { buyers: Buyer[]; onSelect: (b: Buyer) => void; onRefresh: () => Promise<void> }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState<'list'|'kanban'>('list')
  const [showAdd, setShowAdd] = useState(false)
  const [showMatch, setShowMatch] = useState(false)
  const supabase = createClient()

  const addBuyer = async (b: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('buyers').insert({ ...b, user_id: user!.id })
    await onRefresh()
  }
  const changeStatus = async (id: string, status: string) => { await supabase.from('buyers').update({ status }).eq('id', id); await onRefresh() }

  const filtered = buyers
    .filter(b => filter === 'all' || b.status === filter)
    .filter(b => !search || `${b.first_name} ${b.last_name} ${b.email}`.toLowerCase().includes(search.toLowerCase()))
    .map(b => ({ ...b, score: calcScore(b) }))
    .sort((a: any, b: any) => b.score - a.score)

  const totalVisits = buyers.reduce((s,b) => s+(b.visits?.length||0), 0)
  const pending = buyers.reduce((s,b) => s+(b.visits?.filter(v=>!v.followup_sent).length||0), 0)
  const hot = buyers.filter(b => b.status==='hot').length

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Mes acheteurs</h1>
          <p style={{ color: C.dim, fontSize: 14, margin: 0 }}>Gérez votre pipeline et relancez au bon moment.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant="ghost" onClick={() => exportCSV(buyers)}>📥 Exporter</Btn>
          <Btn variant="ghost" onClick={() => setShowMatch(true)}>🔍 Matching</Btn>
          <Btn variant="coral" onClick={() => setShowAdd(true)}>+ Nouvel acheteur</Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Acheteurs', value: buyers.length, icon: '👥', color: C.navy, trend: '' },
          { label: 'Chauds', value: hot, icon: '🔥', color: C.coral, trend: '' },
          { label: 'Visites', value: totalVisits, icon: '🏠', color: C.green, trend: '' },
          { label: 'Suivis en attente', value: pending, icon: '✉️', color: pending > 0 ? C.amber : C.green, trend: '' },
        ].map(stat => (
          <div key={stat.label} style={{ background: C.card, borderRadius: 18, padding: '22px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 16, right: 18, fontSize: 26, opacity: 0.15 }}>{stat.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {pending > 0 && (
        <div style={{ background: C.amberLight, border: `1px solid ${C.amber}33`, borderRadius: 14, padding: '14px 20px', marginBottom: 22, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <span style={{ fontSize: 13, color: C.amber, fontWeight: 700 }}>{pending} visite{pending>1?'s':''} sans suivi envoyé —</span>
          <span style={{ fontSize: 13, color: C.mid }}>cliquez sur un acheteur pour générer le message IA.</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.dim, fontSize: 15 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un acheteur..."
            style={{ width: '100%', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 14px 10px 38px', fontSize: 14, color: C.text, boxSizing: 'border-box', outline: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }} />
        </div>
        <div style={{ display: 'flex', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {[['all','Tous'],['hot','🔥'],['warm','🌡'],['cold','❄️']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: '9px 16px', border: 'none', background: filter===v ? C.navy : 'transparent', color: filter===v ? '#fff' : C.mid, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>
        <div style={{ display: 'flex', background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {[['list','☰ Liste'],['kanban','⬛ Tableau']].map(([v,l]) => (
            <button key={v} onClick={() => setView(v as any)} style={{ padding: '9px 14px', border: 'none', background: view===v ? C.navy : 'transparent', color: view===v ? '#fff' : C.mid, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {view === 'kanban' ? (
        <KanbanView buyers={filtered} onSelect={onSelect} onStatusChange={changeStatus} />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 40px', color: C.dim }}>
          <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.4 }}>👤</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Aucun acheteur</div>
          <div style={{ fontSize: 14, marginBottom: 24 }}>Commencez par ajouter votre premier acheteur.</div>
          <Btn variant="coral" onClick={() => setShowAdd(true)}>+ Créer un acheteur</Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((b: any) => {
            const pend = b.visits?.filter((v: any) => !v.followup_sent).length || 0
            const lastV = [...(b.visits||[])].sort((a: any, c: any) => new Date(c.date).getTime()-new Date(a.date).getTime())[0]
            return (
              <div key={b.id} onClick={() => onSelect(b)}
                style={{ background: C.card, border: `1.5px solid ${pend>0 ? C.amber+'55' : C.border}`, borderRadius: 16, padding: '18px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'; (e.currentTarget as HTMLElement).style.borderColor = C.navy+'33' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = pend>0 ? C.amber+'55' : C.border }}>
                <ScoreRing score={b.score} />
                <Avatar firstName={b.first_name} lastName={b.last_name} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{b.first_name} {b.last_name}</span>
                    <StatusPill status={b.status} />
                    {pend > 0 && <span style={{ fontSize: 11, background: C.amberLight, color: C.amber, border: `1px solid ${C.amber}33`, borderRadius: 100, padding: '3px 10px', fontWeight: 700 }}>⚠ {pend} suivi{pend>1?'s':''}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: C.dim, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>{fmt(b.budget)}</span>
                    <span>{b.rooms}P · {b.min_surface}–{b.max_surface}m²</span>
                    {b.zones?.slice(0,2).map((z: string) => <span key={z}>📍 {z}</span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                  {['hot','warm','cold'].map(s => (
                    <button key={s} onClick={() => changeStatus(b.id, s)}
                      style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${b.status===s ? C.navy : C.border}`, background: b.status===s ? C.navy : 'transparent', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      {s==='hot'?'🔥':s==='warm'?'🌡':'❄️'}
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{b.visits?.length||0} visite{(b.visits?.length||0)!==1?'s':''}</div>
                  {lastV ? <div style={{ fontSize: 11, color: C.dim }}>{REACTIONS[lastV.reaction as keyof typeof REACTIONS]?.icon} {daysAgo(lastV.date)}</div> : <div style={{ fontSize: 11, color: C.dim }}>Pas de visite</div>}
                </div>
                <div style={{ color: C.dim, fontSize: 20, fontWeight: 300 }}>›</div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && <BuyerForm title="Nouvel acheteur" onClose={() => setShowAdd(false)} onSave={async b => { await addBuyer(b); setShowAdd(false) }} />}
      {showMatch && <MatchingModal buyers={buyers} onClose={() => setShowMatch(false)} onSelect={onSelect} />}
    </div>
  )
}

// ─── STATS ───────────────────────────────────────────────────────────────────
function StatsPage({ buyers }: { buyers: Buyer[] }) {
  const total = buyers.length
  const visits = buyers.reduce((s,b) => s+(b.visits?.length||0), 0)
  const sent = buyers.reduce((s,b) => s+(b.visits?.filter(v=>v.followup_sent).length||0), 0)
  const rate = visits ? Math.round((sent/visits)*100) : 0
  const byStatus = { hot: buyers.filter(b=>b.status==='hot').length, warm: buyers.filter(b=>b.status==='warm').length, cold: buyers.filter(b=>b.status==='cold').length }
  const byReaction = { positive: 0, neutral: 0, negative: 0 }
  buyers.forEach(b => b.visits?.forEach(v => { if (v.reaction in byReaction) byReaction[v.reaction as keyof typeof byReaction]++ }))
  const top = [...buyers].map(b => ({ ...b, score: calcScore(b) })).sort((a: any, b: any) => b.score - a.score).slice(0, 5)

  const Bar = ({ label, value, max, color }: any) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.mid }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{value}</span>
      </div>
      <div style={{ background: C.bg, borderRadius: 100, height: 7 }}>
        <div style={{ background: color, borderRadius: 100, height: 7, width: `${max ? (value/max)*100 : 0}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000 }}>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 30 }}>Statistiques</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 22 }}>Pipeline acheteurs</h3>
          <Bar label="🔥 Chauds" value={byStatus.hot} max={total} color={C.coral} />
          <Bar label="🌡 Tièdes" value={byStatus.warm} max={total} color={C.amber} />
          <Bar label="❄️ Froids" value={byStatus.cold} max={total} color={C.dim} />
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 22 }}>Réactions aux visites</h3>
          <Bar label="❤️ Coups de cœur" value={byReaction.positive} max={visits} color={C.green} />
          <Bar label="🤔 Intéressés" value={byReaction.neutral} max={visits} color={C.amber} />
          <Bar label="✕ Non retenus" value={byReaction.negative} max={visits} color={C.red} />
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 22 }}>Taux de relance</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={50} cy={50} r={40} fill="none" stroke={C.bg} strokeWidth={10} />
                <circle cx={50} cy={50} r={40} fill="none" stroke={C.green} strokeWidth={10} strokeDasharray={`${(rate/100)*251} 251`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: C.green }}>{rate}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 15, marginBottom: 6 }}><strong>{sent}</strong> messages envoyés</div>
              <div style={{ fontSize: 13, color: C.dim }}>{visits - sent} encore en attente</div>
            </div>
          </div>
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}` }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Résumé global</h3>
          {[['Acheteurs suivis', total], ['Visites organisées', visits], ['Visites/acheteur', total?(visits/total).toFixed(1):0], ['Taux de relance', `${rate}%`]].map(([k,v]) => (
            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.mid }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ background: C.card, borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${C.border}`, gridColumn: '1 / -1' }}>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>🏆 Priorités — À relancer en premier</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {top.map((b: any, i) => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: C.bg, borderRadius: 14 }}>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: C.dim, width: 28 }}>#{i+1}</span>
                <ScoreRing score={b.score} />
                <Avatar firstName={b.first_name} lastName={b.last_name} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>{b.first_name} {b.last_name} <StatusPill status={b.status} /></div>
                  <div style={{ fontSize: 12, color: C.dim }}>{b.visits?.filter((v: any)=>!v.followup_sent).length||0} suivi(s) en attente · {b.visits?.length||0} visite(s)</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SIDEBAR NAV ──────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, setSelected, userEmail, agentName, onLogout }: { page: string; setPage: (p: string) => void; setSelected: (b: any) => void; userEmail: string; agentName: string; onLogout: () => void }) {
  const initials = agentName ? agentName.split(' ').map((n: string) => n[0]).slice(0,2).join('') : userEmail[0]?.toUpperCase()
  const navItems = [{ id: 'buyers', label: 'Acheteurs', icon: '👥' }, { id: 'stats', label: 'Statistiques', icon: '📊' }, { id: 'profile', label: 'Paramètres', icon: '⚙️' }]
  return (
    <div style={{ width: 240, background: C.sidebar, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 100 }}>
      <div style={{ padding: '28px 22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: C.coral, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 2px 8px rgba(224,92,58,0.4)' }}>🏡</div>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Relanco</div>
            <div style={{ fontSize: 10, color: '#ffffff44', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>PRO</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 12px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#ffffff30', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 8 }}>Navigation</div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setPage(item.id); setSelected(null) }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, border: 'none', background: page === item.id ? C.sidebarActive : 'transparent', color: page === item.id ? '#fff' : '#ffffff66', cursor: 'pointer', fontSize: 14, fontWeight: page === item.id ? 600 : 400, marginBottom: 3, textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (page !== item.id) (e.currentTarget as HTMLElement).style.background = C.sidebarHover; (e.currentTarget as HTMLElement).style.color = '#fff' }}
            onMouseLeave={e => { if (page !== item.id) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#ffffff66' } }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {page === item.id && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: C.coral }} />}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 22px', borderTop: '1px solid #ffffff10' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.sidebarActive, border: '2px solid #ffffff20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffffcc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agentName || userEmail}</div>
            <div style={{ fontSize: 11, color: '#ffffff44', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #ffffff15', background: 'transparent', color: '#ffffff44', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.sidebarHover; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#ffffff44' }}>
          Déconnexion
        </button>
      </div>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

// ─── PROFILE SETTINGS COMPONENT (à coller dans dashboard/page.tsx avant export default) ───
function ProfileSettings({ userEmail, agentName: initialAgentName, supabase }: { userEmail: string; agentName: string; supabase: any }) {
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({ fullName: initialAgentName || '', agency: '', phone: '', title: 'Agent immobilier', signatureExtra: '', website: '' })
  const [password, setPassword] = useState({ new: '', confirm: '' })
  const [pwStatus, setPwStatus] = useState<'idle'|'success'|'error'>('idle')
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) return
      const m = user.user_metadata || {}
      setProfile({ fullName: m.full_name || '', agency: m.agency_name || '', phone: m.phone || '', title: m.title || 'Agent immobilier', signatureExtra: m.signature_extra || '', website: m.website || '' })
    })
  }, [])

  const set = (k: string, v: string) => setProfile(p => ({ ...p, [k]: v }))

  const saveProfile = async () => {
    setSaving(true)
    await supabase.auth.updateUser({ data: { full_name: profile.fullName, agency_name: profile.agency, phone: profile.phone, title: profile.title, signature_extra: profile.signatureExtra, website: profile.website } })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const changePassword = async () => {
    if (password.new !== password.confirm) { setPwStatus('error'); setPwMsg('Les mots de passe ne correspondent pas.'); return }
    if (password.new.length < 6) { setPwStatus('error'); setPwMsg('Minimum 6 caractères.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: password.new })
    setSaving(false)
    if (error) { setPwStatus('error'); setPwMsg(error.message) }
    else { setPwStatus('success'); setPwMsg('Mot de passe mis à jour !'); setPassword({ new: '', confirm: '' }) }
  }

  const initials = profile.fullName ? profile.fullName.split(' ').map((n: string) => n[0]).slice(0,2).join('') : userEmail[0]?.toUpperCase()

  const InputField = ({ label, value, onChange, type = 'text', placeholder, disabled }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        style={{ background: disabled ? C.bg : C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: disabled ? C.dim : C.text, width: '100%', boxSizing: 'border-box' as const, outline: 'none' }}
        onFocus={e => { if (!disabled) (e.target as HTMLInputElement).style.borderColor = C.coral }}
        onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
    </div>
  )

  const tabs = [{ id: 'profile', label: '👤 Profil' }, { id: 'subscription', label: '💳 Abonnement' }, { id: 'security', label: '🔒 Sécurité' }]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 780 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: C.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#fff', boxShadow: '0 4px 16px rgba(224,92,58,0.3)', flexShrink: 0 }}>{initials}</div>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{profile.fullName || 'Mon profil'}</h1>
          <div style={{ fontSize: 14, color: C.dim }}>{profile.agency || 'Agence non renseignée'} · {userEmail}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 5, marginBottom: 24, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: tab === t.id ? C.navy : 'transparent', color: tab === t.id ? '#fff' : C.mid, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t.label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 24px' }}>Informations personnelles</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InputField label="Nom complet" value={profile.fullName} onChange={(e: any) => set('fullName', e.target.value)} placeholder="Sophie Durand" />
              <InputField label="Titre / Poste" value={profile.title} onChange={(e: any) => set('title', e.target.value)} placeholder="Agent immobilier" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InputField label="Agence" value={profile.agency} onChange={(e: any) => set('agency', e.target.value)} placeholder="Orpi Paris 11e" />
              <InputField label="Téléphone" value={profile.phone} onChange={(e: any) => set('phone', e.target.value)} placeholder="06 12 34 56 78" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InputField label="Email (non modifiable)" value={userEmail} disabled />
              <InputField label="Site web" value={profile.website} onChange={(e: any) => set('website', e.target.value)} placeholder="www.votre-agence.fr" />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: 'uppercase' as const, letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Texte additionnel signature</label>
              <textarea value={profile.signatureExtra} onChange={e => set('signatureExtra', e.target.value)} rows={2} placeholder="Ex: Disponible du lundi au vendredi 9h-19h"
                style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 14, color: C.text, width: '100%', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ background: C.bg, borderRadius: 12, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 12 }}>Aperçu signature email</div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ fontWeight: 700 }}>{profile.fullName || 'Votre Nom'}</div>
                <div style={{ color: C.mid }}>{profile.title}</div>
                {profile.agency && <div style={{ color: C.mid }}>{profile.agency}</div>}
                {profile.phone && <div style={{ color: C.mid }}>📞 {profile.phone}</div>}
                {profile.website && <div style={{ color: C.coral }}>{profile.website}</div>}
                {profile.signatureExtra && <div style={{ color: C.mid, fontStyle: 'italic' as const }}>{profile.signatureExtra}</div>}
              </div>
            </div>
            {saved && <div style={{ background: '#E8F5F0', border: '1px solid #1A7A5B33', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.green, fontWeight: 600 }}>✓ Profil enregistré !</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={saveProfile} disabled={saving} style={{ background: C.coral, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(224,92,58,0.3)' }}>
                {saving ? 'Enregistrement...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 24px' }}>Plan actuel</h2>
            <div style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #1E3448 100%)`, borderRadius: 16, padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: C.coral, opacity: 0.08 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#ffffff55', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 8 }}>Plan actuel</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Gratuit</div>
                  <div style={{ fontSize: 13, color: '#ffffff66' }}>Accès aux fonctionnalités de base</div>
                </div>
                <div style={{ background: C.coral, borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fff' }}>ACTIF</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { plan: 'Starter', price: '19€/mois', features: ['50 acheteurs', 'Messages IA illimités', 'Export CSV', 'Support email'], color: C.mid, recommended: false },
                { plan: 'Pro', price: '39€/mois', features: ['Acheteurs illimités', 'Rappels automatiques', 'Multi-agence', 'Support prioritaire'], color: C.coral, recommended: true },
              ].map(p => (
                <div key={p.plan} style={{ border: `2px solid ${p.recommended ? C.coral : C.border}`, borderRadius: 16, padding: 24, position: 'relative' }}>
                  {p.recommended && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.coral, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>RECOMMANDÉ</div>}
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{p.plan}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: p.color, marginBottom: 16 }}>{p.price}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {p.features.map(f => <div key={f} style={{ fontSize: 13, color: C.mid, display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ color: C.green, fontWeight: 700 }}>✓</span>{f}</div>)}
                  </div>
                  <button onClick={() => alert('Paiement Stripe — disponible après déploiement')}
                    style={{ width: '100%', background: p.recommended ? C.coral : 'transparent', color: p.recommended ? '#fff' : C.navy, border: `1.5px solid ${p.recommended ? C.coral : C.border}`, borderRadius: 10, padding: '11px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    Choisir {p.plan}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: C.card, borderRadius: 20, padding: 32, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: C.text, margin: '0 0 24px' }}>Changer le mot de passe</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InputField label="Nouveau mot de passe" type="password" value={password.new} onChange={(e: any) => setPassword(p => ({ ...p, new: e.target.value }))} placeholder="6 caractères minimum" />
              <InputField label="Confirmer le mot de passe" type="password" value={password.confirm} onChange={(e: any) => setPassword(p => ({ ...p, confirm: e.target.value }))} placeholder="Répétez le mot de passe" />
              {pwStatus === 'success' && <div style={{ background: '#E8F5F0', border: '1px solid #1A7A5B33', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.green, fontWeight: 600 }}>✓ {pwMsg}</div>}
              {pwStatus === 'error' && <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '11px 16px', fontSize: 13, color: C.red }}>⚠ {pwMsg}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={changePassword} disabled={saving} style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
          <div style={{ background: '#FEF2F2', border: `1px solid ${C.red}22`, borderRadius: 20, padding: 28 }}>
            <h3 style={{ fontWeight: 700, color: C.red, margin: '0 0 8px', fontSize: 16 }}>Zone de danger</h3>
            <p style={{ fontSize: 13, color: C.mid, margin: '0 0 18px' }}>Action irréversible — toutes vos données seront supprimées.</p>
            <button onClick={async () => { if (!confirm('Supprimer définitivement votre compte ?')) return; await supabase.auth.signOut(); window.location.href = '/login' }}
              style={{ background: '#FEE2E2', color: C.red, border: `1px solid ${C.red}33`, borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Supprimer mon compte
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [selected, setSelected] = useState<Buyer | null>(null)
  const selectedRef = useRef<Buyer | null>(null)
  const [page, setPage] = useState('buyers')
  useEffect(() => { selectedRef.current = selected }, [selected])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [agentName, setAgentName] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserEmail(user.email || '')
    setAgentName(user.user_metadata?.full_name || '')
    const { data } = await supabase.from('buyers').select('*, visits(*)').eq('user_id', user.id).order('created_at', { ascending: false })
    const bs = data || []
    setBuyers(bs)
    if (selectedRef.current) { const up = bs.find((b: Buyer) => b.id === selectedRef.current!.id); if (up) setSelected(up) }
    setLoading(false)
  }, [supabase, router])

  useEffect(() => { loadData() }, [])

  const logout = async () => { await supabase.auth.signOut(); router.push('/login') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>🏡</div>
        <div style={{ fontSize: 14, color: '#ffffff44' }}>Chargement...</div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
      <Sidebar page={page} setPage={setPage} setSelected={setSelected} userEmail={userEmail} agentName={agentName} onLogout={logout} />
      <div style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        {selected
          ? <BuyerDetail buyer={selected} onBack={() => setSelected(null)} onRefresh={loadData} agentName={agentName} agentEmail={userEmail} />
          : page === 'stats'
            ? <StatsPage buyers={buyers} />
            : page === 'profile'
            ? <ProfileSettings userEmail={userEmail} agentName={agentName} supabase={supabase} />
            : <DashboardHome buyers={buyers} onSelect={setSelected} onRefresh={loadData} />
        }
      </div>
    </div>
  )
}
