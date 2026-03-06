import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, fromName, fromEmail } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Destinataire et message requis' }, { status: 400 })
    }

    const htmlMessage = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')

    const { data, error } = await resend.emails.send({
      from: `${fromName || 'Relanco'} <onboarding@resend.dev>`,
      to: [to],
      subject: subject || 'Suivi de votre visite',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1B2A4A;">
          <div style="margin-bottom: 32px;">
            ${htmlMessage}
          </div>
          <div style="border-top: 1px solid #E2DDD5; padding-top: 20px; margin-top: 32px;">
            <div style="font-weight: 700; font-size: 15px;">${fromName || 'Votre agent'}</div>
            ${fromEmail ? `<div style="color: #8A90A0; font-size: 13px;">${fromEmail}</div>` : ''}
            <div style="margin-top: 12px;">
              <img src="https://via.placeholder.com/80x20/1B2A4A/ffffff?text=Relanco" alt="Relanco" style="height: 20px;" />
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
