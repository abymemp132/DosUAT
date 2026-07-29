import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  baseURL: string;
  websiteUsername: string;
  websitePassword: string;
  loginEmail: string;
  loginOTP: string;
  addToCartTestQuery: string;
  isCI: boolean;
  timeout: {
    default: number;
    expect: number;
    navigation: number;
  };
}

export const envConfig: EnvConfig = {
  baseURL: process.env.BASE_URL || "https://dos-web-uat.abym.us/",
  websiteUsername: process.env.WEBSITE_USERNAME || "",
  websitePassword: process.env.WEBSITE_PASSWORD || "",
  loginEmail: process.env.LOGIN_EMAIL || "",
  loginOTP: process.env.LOGIN_OTP || "123456",
  addToCartTestQuery: process.env.ADD_TO_CART_TEST_QUERY || "",
  isCI: !!process.env.CI,
  timeout: {
    default: 30_000,
    expect: 5_000,
    navigation: 45_000
  }
};

export function getBaseURL(): string {
  return envConfig.baseURL;
}

export function getLoginEmail(): string {
  return envConfig.loginEmail;
}

export function getWebsiteUsername(): string {
  return envConfig.websiteUsername;
}

export function getWebsitePassword(): string {
  return envConfig.websitePassword;
}

export function hasWebsiteCredentials(): boolean {
  return Boolean(envConfig.websiteUsername && envConfig.websitePassword);
}

export function getLoginOTP(): string {
  return envConfig.loginOTP;
}

export function isCI(): boolean {
  return envConfig.isCI;
}

export function getTimeout(key: keyof EnvConfig["timeout"]): number {
  return envConfig.timeout[key];
}
