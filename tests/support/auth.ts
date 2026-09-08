import * as fs from "fs";
import * as path from "path";

export const authStatePath = path.join(process.cwd(), ".auth", "user.json");

export function hasAuthState(): boolean {
  return fs.existsSync(authStatePath);
}


