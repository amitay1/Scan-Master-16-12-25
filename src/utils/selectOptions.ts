export function includeCurrentOption(options: string[], currentValue?: string): string[] {
  const normalizedCurrent = currentValue?.trim();
  if (!normalizedCurrent) {
    return options;
  }

  const hasCurrent = options.some(
    (option) => option.trim().toLowerCase() === normalizedCurrent.toLowerCase(),
  );

  if (hasCurrent) {
    return options;
  }

  return [normalizedCurrent, ...options];
}
