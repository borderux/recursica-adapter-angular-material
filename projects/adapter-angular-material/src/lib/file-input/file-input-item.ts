export interface RecursicaFileUploadItem {
  file: File;
  id?: string;
}

/**
 * Direct port of the genesis adapter's own `fileMatchesAccept`
 * (`@recursica/adapter-common`) — read from its compiled output since only
 * a `.d.ts` ships in this monorepo's `node_modules`, not the source.
 * Mirrors the native HTML `accept` attribute's semantics (comma-separated
 * extensions, MIME types, or MIME wildcards like `image/*`) so drag-and-drop
 * can be validated the same way the browser validates its own file-picker
 * dialog — `accept` on a native `<input type="file">` only filters that
 * dialog, never a `drop` event, so without this a dropped file bypasses the
 * restriction entirely.
 */
export function fileMatchesAccept(file: File, accept?: string): boolean {
  const patterns = (accept ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) {
      return name.endsWith(pattern);
    }
    if (pattern.endsWith("/*")) {
      return type.startsWith(pattern.slice(0, -1));
    }
    return type === pattern;
  });
}
