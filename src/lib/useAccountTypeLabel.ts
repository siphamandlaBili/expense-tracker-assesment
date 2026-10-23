import { useTranslation } from "react-i18next";

const KNOWN_ACCOUNT_TYPES = ["premium", "standard", "business"] as const;
type KnownAccountType = (typeof KNOWN_ACCOUNT_TYPES)[number];

const isKnownAccountType = (type: string): type is KnownAccountType =>
  (KNOWN_ACCOUNT_TYPES as readonly string[]).includes(type);

/**
 * Display name for the profile's `accountType` ("premium" to "Premium
 * Account"). An unknown type from the API is shown as-is.
 */
export function useAccountTypeLabel() {
  const { t } = useTranslation();
  return (type: string) =>
    isKnownAccountType(type) ? t(`dashboard.accountType.${type}`) : type;
}
