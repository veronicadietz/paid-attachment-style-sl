# Personalized Attachment Profile

Paid, branded attachment assessment for Securely Loved. The app includes 32 original questions, dimensional scoring, close-result blend detection, a personalized results screen, PDF generation, private report storage, and email/Ivorey integration hooks.

## Local development

```bash
pnpm install
pnpm dev
```

The hosted app uses D1 (`DB`) for purchases and assessment records and R2 (`FILES`) for private PDF files. Drizzle migrations live in `drizzle/`.

## Ivorey handoff

Configure an Ivorey workflow triggered by **Order Submitted** for the $47 Personalized Attachment Profile. Add a POST webhook to:

```text
https://YOUR-ASSESSMENT-DOMAIN/api/ivorey/order
```

Send the `x-ivorey-secret` header and map these JSON fields from Ivorey custom values:

```json
{
  "orderId": "unique Ivorey order or transaction id",
  "email": "contact email",
  "firstName": "contact first name",
  "contactId": "Ivorey contact id",
  "productName": "Personalized Attachment Profile",
  "amountCents": 4700
}
```

Set the paid form redirect URL to the deployed assessment URL. If Ivorey supports contact values in redirects, use:

```text
https://YOUR-ASSESSMENT-DOMAIN/?first_name={{contact.first_name}}&email={{contact.email}}&contact_id={{contact.id}}
```

The customer confirms the checkout email. The app verifies that a paid purchase exists before issuing 12-hour assessment access.

## Email delivery

Set `RESEND_API_KEY` after verifying `securelyloved.com` with the email provider. Reports are sent from `bev@securelyloved.com` as an attachment and a seven-day secure download link.

## Privacy defaults

- Download links expire after seven days.
- PDF files and score summaries are designed for three-year retention.
- Item-level answers are designed for a 12-month cleanup policy.
- Customers should be able to request earlier deletion.
- This tool is educational and non-diagnostic.
