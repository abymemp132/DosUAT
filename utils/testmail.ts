import "dotenv/config";

export async function getOtpFromTestmail(tag: string, timeoutMs = 60000): Promise<string | null> {
  const apikey = process.env.TESTMAIL_API_KEY || "3ccd5b9e-de12-4c6f-ab3e-e30cbf58dcf6";
  const namespace = process.env.TESTMAIL_NAMESPACE || "twkxl";

  if (!apikey || !namespace) {
    throw new Error("TESTMAIL_API_KEY and TESTMAIL_NAMESPACE must be set in .env");
  }

  // Only consider emails received from 10 seconds ago onwards to avoid old OTPs
  const timestampFrom = Date.now() - 10000;
  const url = `https://api.testmail.app/api/json?apikey=${apikey}&namespace=${namespace}&tag=${tag}&livequery=true&timestamp_from=${timestampFrom}`;

  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url);
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
          return otpMatch[0];
        }
      }
    } catch (e) {
      console.error("Error fetching from Testmail.app:", e);
    }

    // Wait a bit before polling again in case of failure or empty result
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return null;
}
