// supabase/functions/send-notification/index.ts
// Supabase Edge Function — dispatches email (Resend) and Teams (Incoming Webhook) notifications
//
// Deploy: supabase functions deploy send-notification
// Set secrets:
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'HorizonRail <notifications@horizonrail.app>'

interface NotificationPayload {
  type: string
  recipient_email?: string
  recipient_name?: string
  subject?: string
  body_html?: string
  deep_link?: string
  teams_webhook_url?: string
  teams_card?: {
    title: string
    subtitle: string
    facts: { name: string; value: string }[]
    action_url: string
    action_label: string
  }
}

// ─── Email via Resend ────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  toName: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log('[send-notification] RESEND_API_KEY not set — skipping email')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [`${toName} <${to}>`],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[send-notification] Resend error:', err)
      return { ok: false, error: err }
    }

    const data = await res.json()
    console.log('[send-notification] Email sent:', data.id)
    return { ok: true }
  } catch (e) {
    console.error('[send-notification] Email send failed:', e)
    return { ok: false, error: String(e) }
  }
}

// ─── Teams via Incoming Webhook ──────────────────────────────────────────────

async function sendTeamsCard(
  webhookUrl: string,
  card: NotificationPayload['teams_card'],
): Promise<{ ok: boolean; error?: string }> {
  if (!webhookUrl || !card) {
    return { ok: false, error: 'Missing webhook URL or card' }
  }

  // Build the Adaptive Card payload for Teams
  const teamsPayload = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              size: 'Large',
              weight: 'Bolder',
              text: card.title,
              wrap: true,
              style: 'heading',
            },
            {
              type: 'TextBlock',
              text: card.subtitle,
              wrap: true,
              spacing: 'Small',
              isSubtle: true,
            },
            {
              type: 'FactSet',
              facts: card.facts.map((f) => ({
                title: f.name,
                value: f.value,
              })),
              spacing: 'Medium',
            },
          ],
          actions: [
            {
              type: 'Action.OpenUrl',
              title: card.action_label,
              url: card.action_url,
              style: 'positive',
            },
          ],
          msteams: {
            width: 'Full',
          },
        },
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsPayload),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[send-notification] Teams webhook error:', err)
      return { ok: false, error: err }
    }

    console.log('[send-notification] Teams card sent successfully')
    return { ok: true }
  } catch (e) {
    console.error('[send-notification] Teams webhook failed:', e)
    return { ok: false, error: String(e) }
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: NotificationPayload = await req.json()
    const results: Record<string, unknown> = { type: payload.type }

    // 1. Send email if applicable
    if (payload.recipient_email && payload.subject && payload.body_html) {
      results.email = await sendEmail(
        payload.recipient_email,
        payload.recipient_name ?? 'User',
        payload.subject,
        payload.body_html,
      )
    }

    // 2. Send Teams card if applicable
    if (payload.teams_webhook_url && payload.teams_card) {
      results.teams = await sendTeamsCard(payload.teams_webhook_url, payload.teams_card)
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('[send-notification] Handler error:', e)
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
