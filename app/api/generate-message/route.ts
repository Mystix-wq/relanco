import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { buyer, visit } = await req.json()

    const prompt = `Tu es un agent immobilier professionnel. Rédige un message de suivi court et personnalisé après une visite.

Acheteur : ${buyer.first_name} ${buyer.last_name}
Budget : ${new Intl.NumberFormat('fr-FR').format(buyer.budget)} €
Recherche : ${buyer.rooms} pièces, ${buyer.min_surface}–${buyer.max_surface}m², zones : ${buyer.zones?.join(', ')}
Notes : ${buyer.notes || 'aucune'}

Visite : ${visit.address}
Prix : ${visit.price ? new Intl.NumberFormat('fr-FR').format(visit.price) + ' €' : 'non renseigné'}
Surface : ${visit.surface}m², ${visit.rooms} pièces
Réaction : ${visit.reaction === 'positive' ? 'Coup de cœur' : visit.reaction === 'neutral' ? 'Intéressé mais hésitant' : 'Non retenu'}
Notes : ${visit.notes || 'aucune'}

Rédige 3-4 phrases maximum en français. Commence par "Bonjour ${buyer.first_name},". Sois chaleureux et professionnel. Propose une prochaine étape concrète adaptée à la réaction. Termine par "Bien cordialement". Réponds uniquement avec le message.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const message = data.content?.[0]?.text || ''
    return NextResponse.json({ message })
  } catch (error) {
    return NextResponse.json({ message: '' }, { status: 500 })
  }
}
