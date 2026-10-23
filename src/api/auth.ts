import { apiRequest } from "./client";
import { signInResponseSchema } from "./schemas";

export const authApi = {
  signIn: (credentials: { accountNumber: string; pin: string }) =>
    apiRequest("/auth/sign-in", {
      method: "POST",
      body: credentials,
      schema: signInResponseSchema,
    }),
};
