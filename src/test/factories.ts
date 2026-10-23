import type { Session } from "../auth/session";
import type { SignInValues } from "../components/auth/signInSchema";
import {
  ACTIVE_USER,
  EMPTY_USER,
  ERROR_USER,
  type MockUser,
} from "../mocks/fixtures";

/** Defaults to the active demo user's real credentials. */
export function buildSignInValues(
  overrides: Partial<SignInValues> = {},
): SignInValues {
  return {
    accountNumber: ACTIVE_USER.accountNumber,
    pin: ACTIVE_USER.pin,
    ...overrides,
  };
}

export function sessionFor(user: MockUser): Session {
  return { customerId: user.customerId, name: user.profile.name };
}

export const sessions = {
  active: sessionFor(ACTIVE_USER),
  empty: sessionFor(EMPTY_USER),
  error: sessionFor(ERROR_USER),
};
