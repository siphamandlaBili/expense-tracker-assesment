import { LuUser } from "react-icons/lu";

type UserAvatarProps = {
  size?: "sm" | "lg";
  /** Accessible name; without one the avatar is decorative. */
  label?: string;
};

/** Grey outlined circle with a person icon, for the signed-in customer. */
export function UserAvatar({ size = "sm", label }: UserAvatarProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-transparent text-body ${
        size === "lg" ? "size-16" : "size-9"
      }`}
    >
      <LuUser className={size === "lg" ? "size-8" : "size-5"} aria-hidden />
    </span>
  );
}
