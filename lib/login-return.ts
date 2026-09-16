import { safeInternalPath } from "./safe-navigation";

export const LOGIN_RETURN_COOKIE = "wms_return_to";
export const LOGIN_RETURN_COOKIE_MAX_AGE_SECONDS = 5 * 60;

export function safeLoginReturnPath(value: unknown) {
  return safeInternalPath(value);
}
