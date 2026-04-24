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

export async function getOtpFromMailSlurp(): Promise<string> {
    const apiKey = process.env.MAILSLURP_API_KEY;
    const inboxId = process.env.MAILSLURP_INBOX_ID;

    if (!apiKey || !inboxId) {
        throw new Error("MAILSLURP_API_KEY and MAILSLURP_INBOX_ID must be set in .env");
    }

    const mailslurp = new MailSlurp({ apiKey });
    
    console.log(`[MailSlurp] Waiting for OTP email in inbox: ${inboxId}...`);

    try {
        // Optimizing: Use waitForMatchingFirstEmail with multiple OR conditions
        const email = await mailslurp.waitController.waitForMatchingFirstEmail({
            inboxId: inboxId,
            matchOptions: {
                matches: [
                    { field: 'SUBJECT', should: 'CONTAIN', value: 'Verification' } as any,
                    { field: 'SUBJECT', should: 'CONTAIN', value: 'OTP' } as any,
                    { field: 'SUBJECT', should: 'CONTAIN', value: 'code' } as any
                ]
            },
            timeout: 60000,
            unreadOnly: true
        }).catch(async () => {
            console.log("[MailSlurp] Subject match failed, falling back to latest unread email...");
            return await mailslurp.waitController.waitForLatestEmail({
                inboxId: inboxId,
                unreadOnly: true,
                timeout: 30000
            });
        });

        console.log(`[MailSlurp] Email received: "${email.subject}"`);

        // Strip HTML and find 6-digit codes, prioritizing those near "OTP" or "code" text
        const plainTextBody = email.body?.replace(/<[^>]*>?/gm, ' ') || "";
        
        // Search for 6-digit codes that aren't HEX colors
        const otpMatches = plainTextBody.match(/(?<!#)\b\d{6}\b/g);
        
        if (!otpMatches || otpMatches.length === 0) {
            console.error(`[MailSlurp] Failed to find OTP in body: ${plainTextBody.substring(0, 500)}`);
            throw new Error("Could not find a 6-digit OTP in the email body.");
        }

        // If multiple 6-digit numbers, pick the one that is closest to keywords
        let finalOtp = otpMatches[0];
        if (otpMatches.length > 1) {
            console.log(`[MailSlurp] Multiple 6-digit codes found: ${otpMatches.join(', ')}. Choosing best match...`);
            const bodyLower = plainTextBody.toLowerCase();
            const keywords = ['otp', 'verification', 'code', 'login'];
            
            let bestScore = -1;
            for (const code of otpMatches) {
                const index = plainTextBody.indexOf(code);
                let score = 0;
                keywords.forEach(kw => {
                    const kwIndex = bodyLower.indexOf(kw);
                    if (kwIndex !== -1) {
                        score += 1 / (Math.abs(index - kwIndex) + 1);
                    }
                });
                if (score > bestScore) {
                    bestScore = score;
                    finalOtp = code;
                }
            }
        }

        console.log(`[MailSlurp] Dynamic OTP extracted: ${finalOtp}`);
        
        // Delete the email after extraction
        await mailslurp.emailController.deleteEmail({ emailId: email.id }).catch(() => {});
        
        return finalOtp;
    } catch (error) {
        console.error(`[MailSlurp] Error fetching email:`, error);
        throw error;
    }
}
