# Portfolio enquiry email setup (Cloudflare Pages + Resend)

Enquiries from **Send by email** now POST to `/api/enquiry`. The Pages Function sends the message to `bv.prasannakumar@gmail.com`. It uses Resend's HTTPS API from Cloudflare, not SMTP in the browser, so no paid business mailbox or always-on SMTP server is required.

## Activate delivery

1. Create a Resend account and verify ownership of **bvprasanna.com** under Resend Domains. Add only the DNS verification/sending records Resend explicitly supplies in **Cloudflare DNS**. Keep existing MX records if you use other email services.
2. In Cloudflare → Workers & Pages → **bvprasanna** → Settings → Variables and Secrets, add:
   - `RESEND_API_KEY` (secret; generated in Resend)
   - `ENQUIRY_FROM` = `Website Enquiries <enquiries@bvprasanna.com>` (must use a Resend-verified domain)
3. Redeploy the Pages project so its Functions receive those bindings.
4. Submit a real test enquiry. Confirm the email arrives in `bv.prasannakumar@gmail.com` and inspect its spam folder if necessary.
5. Configure Cloudflare WAF rate limiting for `/api/enquiry`. For higher-volume traffic, add Turnstile to the frontend **before** setting `TURNSTILE_SECRET` on the backend; otherwise every submission will require a token that the current form does not yet supply.

**Do not paste API keys into GitHub, HTML, screenshots, or this chat.** A secret cannot be configured through the repository alone.

## Cost and behavior

Resend offers a limited free plan; review current allowances before use. The server returns 200 only when the email API provides an accepted message ID; this is not a guarantee of final inbox delivery. When the provider is unconfigured, the form gives a meaningful error and WhatsApp remains available.

Important: this is a Cloudflare Pages Function and must be deployed using the Git-connected Pages project, not a static-only ZIP or generic Worker configuration.

## Local test

Run `npm test` after adding a test runner, or manually use a Cloudflare Pages preview with preview environment secrets. No SMTP secrets are stored in source control.
