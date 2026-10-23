/** Base URL for the spending API. Relative by default (same origin). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/** Customer shown until real authentication maps a login to a customer. */
export const DEMO_CUSTOMER_ID = "12345";
