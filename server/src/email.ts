import { Resend } from "resend"

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is not set`)
  }

  return value
}

const resend = new Resend(
  getRequiredEnv("RESEND_API_KEY"),
)

const emailFrom = getRequiredEnv("EMAIL_FROM")

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export async function sendAccessCodeEmail({
  email,
  name,
  eventName,
  accessCode,
}: {
  email: string
  name: string
  eventName: string
  accessCode: string
}) {
  const safeName = escapeHtml(name)
  const safeEventName = escapeHtml(eventName)

  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to: [email],
    subject: `Your eCERTIFY access code — ${eventName}`,
    text: `Hi ${name},

Your registration for ${eventName} was successful.

Your eCERTIFY certificate access code is:

${accessCode}

Please keep this code safe. You will use it to access your certificate after the organizer issues it.

Your certificate is not issued yet. You will be able to retrieve it once the organizer marks you eligible and issues your certificate.

— eCERTIFY`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background:#f4f4f5; padding:40px 20px;">
        <div style="max-width:560px; margin:0 auto; background:#ffffff; padding:40px; border-radius:16px;">
          
          <div style="font-size:22px; font-weight:700; margin-bottom:32px;">
            eCERTIFY
          </div>

          <p style="font-size:16px; color:#18181b;">
            Hi ${safeName},
          </p>

          <p style="font-size:15px; line-height:1.7; color:#52525b;">
            Your registration for
            <strong>${safeEventName}</strong>
            was successful.
          </p>

          <p style="font-size:13px; text-transform:uppercase; letter-spacing:2px; color:#71717a; margin-top:32px;">
            Certificate Access Code
          </p>

          <div style="margin-top:10px; padding:20px; background:#f4f4f5; border-radius:12px; text-align:center;">
            <span style="font-family:monospace; font-size:28px; font-weight:700; letter-spacing:6px;">
              ${accessCode}
            </span>
          </div>

          <p style="font-size:14px; line-height:1.7; color:#52525b; margin-top:24px;">
            Keep this code safe. You will use it to access your certificate
            after the organizer issues it.
          </p>

          <p style="font-size:14px; line-height:1.7; color:#52525b;">
            Your certificate is not issued yet. It will become available
            once the organizer marks you eligible and issues your certificate.
          </p>

          <div style="margin-top:32px; padding-top:20px; border-top:1px solid #e4e4e7; font-size:12px; color:#a1a1aa;">
            DIGITAL CERTIFICATES FOR EVENTS
          </div>

        </div>
      </div>
    `,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}