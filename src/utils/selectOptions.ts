export function includeCurrentOption(options: string[], currentValue?: string): string[] {
  const normalizedCurrent = currentValue?.trim();
  if (!normalizedCurrent) {
    return options;
  }

  const hasExactCurrent = options.some(
    (option) => option.trim() === normalizedCurrent,
  );

  if (hasExactCurrent) {
    return options;
  }

  const filteredOptions = options.filter(
    (option) => option.trim().toLowerCase() !== normalizedCurrent.toLowerCase(),
  );

  return [normalizedCurrent, ...filteredOptions];
}
