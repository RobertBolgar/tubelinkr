/**
 * Format source code to human-readable label
 * Maps null/undefined/empty values to "Direct"
 * Maps known source codes to their labels
 * Returns unknown source codes as-is
 */
export function formatSourceLabel(source: string | null | undefined): string {
  // Map missing/untracked values to "Direct"
  if (source === null || source === undefined || source === '' || source === 'null' || source === 'NULL') {
    return 'Direct';
  }

  // Map known source codes to labels
  const sourceMap: Record<string, string> = {
    'd': 'Description',
    'p': 'Pinned Comment',
    'b': 'Bio',
    's1': 'Short 1',
    'v1': 'Video 1',
  };

  // Return mapped label or source code as-is
  return sourceMap[source] || source;
}
