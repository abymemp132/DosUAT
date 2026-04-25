import { MailSlurp } from 'mailslurp-client';

/**
 * Utility to fetch OTP from MailSlurp inbox.
 * Requires MAILSLURP_API_KEY and MAILSLURP_INBOX_ID in .env
 */
export async function clearMailSlurpInbox(): Promise<void> {
    const apiKey = process.env.MAILSLURP_API_KEY;
    const inboxId = process.env.MAILSLURP_INBOX_ID;

    if (!apiKey || !inboxId) return;

    const mailslurp = new MailSlurp({ apiKey });
    console.log(`[MailSlurp] Clearing old messages in inbox: ${inboxId}...`);
    await mailslurp.inboxController.deleteAllInboxEmails({ inboxId }).catch(() => {});
}

function describeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'status' in error) {
        const resp = error as { status?: number; statusText?: string; url?: string };
        return `HTTP ${resp.status} ${resp.statusText || ''} ${resp.url || ''}`.trim();
    }
    return String(error);
}

export async function getOtpFromMailSlurp(maxRetries = 3): Promise<string> {
    const apiKey = process.env.MAILSLURP_API_KEY;
    const inboxId = process.env.MAILSLURP_INBOX_ID;

    if (!apiKey || !inboxId) {
        throw new Error("MAILSLURP_API_KEY and MAILSLURP_INBOX_ID must be set in .env");
    }

    const mailslurp = new MailSlurp({ apiKey });
    
    console.log(`[MailSlurp] Waiting for OTP email in inbox: ${inboxId}...`);

    let lastError: unknown = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const otp = await attemptOtpExtraction(mailslurp, inboxId, attempt);
            if (otp) return otp;
        } catch (error) {
            lastError = error;
            console.warn(`[MailSlurp] Attempt ${attempt}/${maxRetries} failed: ${describeError(error)}`);
            
            if (attempt < maxRetries) {
                const backoffMs = attempt * 5_000;
                console.log(`[MailSlurp] Retrying in ${backoffMs / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, backoffMs));
            }
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error(`[MailSlurp] All ${maxRetries} OTP extraction attempts failed. Last error: ${describeError(lastError)}`);
}

async function attemptOtpExtraction(mailslurp: MailSlurp, inboxId: string, attempt: number): Promise<string> {
    // Generous timeout — email delivery can be slow, especially on first attempt
    const timeout = attempt === 1 ? 90_000 : 60_000;

    console.log(`[MailSlurp] Attempt ${attempt}: Waiting up to ${timeout / 1000}s for email...`);

    let email: Awaited<ReturnType<typeof mailslurp.waitController.waitForLatestEmail>> | null = null;

    try {
        // We already cleared the inbox before requesting OTP, so any email present
        // should be the OTP. Use unreadOnly=false to avoid missing emails that were
        // auto-read by a previous failed extraction attempt.
        email = await mailslurp.waitController.waitForLatestEmail({
            inboxId: inboxId,
            unreadOnly: false,
            timeout: timeout,
        });
    } catch (waitError: unknown) {
        // MailSlurp throws the raw Response on 404 (no email found within timeout).
        // Wrap it in a proper Error for better diagnostics.
        throw new Error(
            `waitForLatestEmail failed: ${describeError(waitError)}`
        );
    }

    if (!email || !email.id) {
        throw new Error(`[MailSlurp] No email received within ${timeout / 1000}s (attempt ${attempt}).`);
    }

    console.log(`[MailSlurp] Email received: "${email.subject}" (id: ${email.id})`);

    // Strip HTML tags and decode entities to get plain text
    const rawBody = email.body || "";
    const plainTextBody = rawBody
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/\s+/g, ' ')
        .trim();
    
    // Search for 4-to-6-digit codes that aren't HEX colors or years
    const otpMatches = plainTextBody.match(/(?<!#)\b\d{4,6}\b/g);
    
    if (!otpMatches || otpMatches.length === 0) {
        console.error(`[MailSlurp] No OTP pattern found in email body (first 600 chars): ${plainTextBody.substring(0, 600)}`);
        // Delete this email so the next retry can look for a fresh one
        await mailslurp.emailController.deleteEmail({ emailId: email.id }).catch(() => {});
        throw new Error("Could not find OTP digits in the email body.");
    }

    // Prefer 6-digit codes, then 4-digit, prioritize proximity to keywords
    const sixDigit = otpMatches.filter(m => m.length === 6);
    const candidates = sixDigit.length > 0 ? sixDigit : otpMatches;

    let finalOtp = candidates[0];
    
    if (candidates.length > 1) {
        console.log(`[MailSlurp] Multiple codes found: ${candidates.join(', ')}. Selecting best match...`);
        const bodyLower = plainTextBody.toLowerCase();
        const keywords = ['otp', 'verification', 'code', 'login', 'verify', 'one-time', 'one time'];
        
        let bestScore = -1;
        for (const code of candidates) {
            const index = plainTextBody.indexOf(code);
            let score = 0;
            for (const kw of keywords) {
                const kwIndex = bodyLower.indexOf(kw);
                if (kwIndex !== -1) {
                    // Higher score = keyword is closer to the code
                    score += 1 / (Math.abs(index - kwIndex) + 1);
                }
            }
            if (score > bestScore) {
                bestScore = score;
                finalOtp = code;
            }
        }
    }

    console.log(`[MailSlurp] Dynamic OTP extracted: ${finalOtp}`);
    
    // Delete the email after successful extraction
    await mailslurp.emailController.deleteEmail({ emailId: email.id }).catch(() => {});
    
    return finalOtp;
}
