// Shared form control styles (sign-in, goal forms), so every form matches.

export const inputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-white px-4 py-2.5 text-heading tracking-wider outline-none transition autofill:shadow-[inset_0_0_0_1000px_white] placeholder:tracking-normal placeholder:text-body/60 focus:ring-1 ${
    hasError
      ? "border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-primary focus:ring-primary"
  }`;

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-heading transition-colors hover:bg-dashboard";
