# Securely Loved Personalized Attachment Profile

Paid, branded attachment assessment for Securely Loved. It includes 32 original questions, close-result blend detection, an immediate personalized PDF, private report storage, purchase verification, and Ivorey delivery hooks.

## The stack

- **GitHub** — source code and version history
- **Vercel** — website, API routes, and private Blob storage
- **Ivorey** — checkout, customer record, and email from `bev@securelyloved.com`
- **Google** — optional manual backup only; it is not required to run the assessment

## Run locally

```bash
pnpm install
pnpm dev
```

Local development allows demo access without a recorded purchase. Production requires the signing secret, private Blob store, and a matching paid-purchase record.

## Deploy through Vercel

1. In Vercel, choose **Add New → Project** and import `veronicadietz/paid-attachment-style-sl` from GitHub.
2. Keep the detected framework as **Next.js** and deploy.
3. In the Vercel project, create and connect a **private Blob store**. Vercel adds the storage credentials to the project automatically.
4. Add these project environment variables for Production, Preview, and Development where appropriate:

```text
ASSESSMENT_SIGNING_SECRET=a-long-random-private-value
IVOREY_WEBHOOK_SECRET=another-long-random-private-value
IVOREY_RESULT_WEBHOOK_URL=https://the-inbound-webhook-url-created-in-ivorey
```

5. Redeploy after saving the variables.

## Connect the `paid.securelyloved.com` domain

1. In Vercel, open the project and go to **Settings → Domains**.
2. Add `paid.securelyloved.com`.
3. Vercel will show the exact DNS record it requires. In GoDaddy DNS, edit the existing `paid` CNAME and replace the GitHub Pages value with the exact Vercel CNAME target shown there.
4. Disable GitHub Pages for this repository so it no longer tries to claim the domain.
5. Wait for Vercel to show the domain as valid. Vercel provisions HTTPS automatically.

No Cloudflare account, nameserver change, Worker, D1 database, or R2 bucket is used.

## Ivorey purchase verification

Create an Ivorey workflow triggered after successful payment for **Personalized Attachment Profile — $47**. Add a webhook action:

```text
POST https://paid.securelyloved.com/api/ivorey/order
Content-Type: application/json
x-ivorey-secret: the same value as IVOREY_WEBHOOK_SECRET
```

Map the Ivorey customer/order values into this JSON body:

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

Set the paid form's successful-payment redirect to:

```text
https://paid.securelyloved.com/?first_name={{contact.first_name}}&email={{contact.email}}&contact_id={{contact.id}}
```

The exact merge-field names may differ in Ivorey. Select the matching contact fields from Ivorey's merge-field picker rather than typing placeholders if the builder provides one.

## Ivorey report email

Create an inbound webhook workflow in Ivorey and put that webhook URL in `IVOREY_RESULT_WEBHOOK_URL`. After a report is generated, the app sends Ivorey these values:

```json
{
  "event": "attachment_profile.completed",
  "assessmentId": "report id",
  "firstName": "customer first name",
  "email": "customer email",
  "ivoreyContactId": "contact id when available",
  "primaryStyle": "leading style",
  "secondaryStyle": "secondary style",
  "isBlend": true,
  "reportUrl": "secure seven-day download link",
  "completedAt": "ISO timestamp"
}
```

Use those values to find/update the contact and send the delivery email from `bev@securelyloved.com`. Put `reportUrl` behind a button such as **Download My Personalized Profile**. The buyer also receives the same immediate download link on the results screen.

## Report retention and customer copies

Vercel Blob stores the paid-purchase record, assessment summary, and PDF privately. A public filename is never exposed, and the emailed download link expires after seven days. The underlying report remains in private Vercel storage until it is manually deleted, so support can retrieve and resend it if the customer needs another copy. Choose and publish a retention policy before launch; three years is a practical starting point for this product, with earlier deletion available on request. The app does not store item-by-item answers.

The assessment is an educational self-reflection tool, not a clinical diagnosis or substitute for mental health care.
