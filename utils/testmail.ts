import "dotenv/config";

export async function getOtpFromTestmail(tag: string, timeoutMs = 30000): Promise<string | null> {
  const apikey = process.env.TESTMAIL_API_KEY || "3ccd5b9e-de12-4c6f-ab3e-e30cbf58dcf6";
  const namespace = process.env.TESTMAIL_NAMESPACE || "twkxl";

  if (!apikey || !namespace) {
    throw new Error("TESTMAIL_API_KEY and TESTMAIL_NAMESPACE must be set in .env");
  }

  // Only consider emails received from 10 seconds ago onwards to avoid old OTPs
  const timestampFrom = Date.now() - 10000;
  // Use standard json query without hanging livequery connection
  const url = `https://api.testmail.app/api/json?apikey=${apikey}&namespace=${namespace}&tag=${tag}&timestamp_from=${timestampFrom}`;

  const startTime = Date.now();
  let attempt = 0;
  
  while (Date.now() - startTime < timeoutMs) {
    attempt++;
    const elapsedSecs = Math.round((Date.now() - startTime) / 1000);
    console.log(`[Testmail] Polling for OTP email (attempt ${attempt}, ${elapsedSecs}s elapsed)...`);

    try {
      // Set a 5-second per-request timeout so fetch never hangs indefinitely
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
         throw new Error(`Testmail.app API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      if (data.result === "success" && data.emails && data.emails.length > 0) {
        // Testmail sorts by newest first
        const email = data.emails[0];
        const text = email.text || email.html || "";
        
        // Match a 6-digit OTP
        const otpMatch = text.match(/\b\d{6}\b/);
        if (otpMatch) {
          console.log(`[Testmail] OTP found in email: ${otpMatch[0]}`);
          return otpMatch[0];
        }
      }
    } catch (e: any) {
      if (e.name === "TimeoutError" || e.name === "AbortError") {
        console.log(`[Testmail] Request timed out on attempt ${attempt}. Retrying...`);
      } else {
        console.error(`[Testmail] Error on attempt ${attempt}:`, e instanceof Error ? e.message : e);
      }
    }

    // Wait 3 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.warn(`[Testmail] Timed out after ${Math.round((Date.now() - startTime) / 1000)}s without receiving OTP email.`);
  return null;
}

