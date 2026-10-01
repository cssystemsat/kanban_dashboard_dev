export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
  googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY ?? "",
  googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? "",
  googleSheetsPrimaryId:
    process.env.GOOGLE_SHEETS_PRIMARY_ID ??
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID ??
    "",
  googleSheetsSecondaryId: process.env.GOOGLE_SHEETS_SECONDARY_ID ?? "",
  wootricApiKey: process.env.WOOTRIC_API_KEY ?? "",
  wootricClientId: process.env.WOOTRIC_CLIENT_ID ?? "",
  wootricClientSecret: process.env.WOOTRIC_CLIENT_SECRET ?? "",
  wootricWebhookSecret: process.env.WOOTRIC_WEBHOOK_SECRET ?? "",
};
