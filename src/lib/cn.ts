type ClassValue = string | false | null | undefined;

/** Join class names, dropping falsy entries. */
export const cn = (...classes: ClassValue[]): string =>
  classes.filter(Boolean).join(" ");
