import { environment } from "../environments/environment";

export const OAuthSettings = {
  appId: 'e3aaa150-1815-4a18-b66f-cbb0c9a9e3ce',
  redirectUri: environment.redirectUri,
  scopes: ['user.read', 'Files.Read', 'Files.ReadWrite'],
};
