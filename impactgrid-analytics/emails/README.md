# Emails

Transactional email templates (welcome email, invoice, admin notification)
go here. Wire up with Resend using `RESEND_API_KEY` from `.env.example`,
and trigger them from `app/api/webhooks/stripe/route.ts` where the
`TODO: send welcome email` comments are.

Suggested templates to add:
- `welcome.tsx` — sent to the client after payment succeeds
- `invoice.tsx` — sent alongside the Stripe receipt
- `admin-new-order.tsx` — internal notification for the studio team
- `project-update.tsx` — sent when a project's stage changes
