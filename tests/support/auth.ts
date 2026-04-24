import fs from "fs";
import path from "path";

export const authStatePath = path.join(process.cwd(), ".auth", "user.json");
export const hasAuthState = fs.existsSync(authStatePath);

export function ensureAuthState(silent = false): boolean {
  if (!fs.existsSync(authStatePath)) {
    if (!silent) {
       console.log("\x1b[33m[Auth] Session not found at: " + authStatePath + "\x1b[0m");
    }
    return false;
  }
  return true;
}
