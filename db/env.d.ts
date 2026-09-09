declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    FILES: R2Bucket;
    RESEND_API_KEY?: string;
    IVOREY_RESULT_WEBHOOK_URL?: string;
    IVOREY_WEBHOOK_SECRET?: string;
    ASSESSMENT_SIGNING_SECRET?: string;
  }
}
