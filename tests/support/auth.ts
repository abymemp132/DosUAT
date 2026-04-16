import fs from "fs";
import path from "path";

export const authStatePath = path.join(process.cwd(), ".auth", "user.json");
export const hasAuthState = fs.existsSync(authStatePath);
