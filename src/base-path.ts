/** Repository identity comes from GitHub Actions, a local remote, or the folder name. */
export function pagesBase(repositoryName: string, explicitBase?: string): string {
  if (explicitBase !== undefined) {
    if (!explicitBase.startsWith('/') || !explicitBase.endsWith('/') || /[?#\\]/.test(explicitBase)) {
      throw new Error('PAGES_BASE_PATH must start and end with / and contain no query, hash, or backslash.');
    }
    return explicitBase;
  }
  const name = repositoryName.split('/').at(-1) ?? '';
  if (!/^[A-Za-z0-9_.-]+$/.test(name)) throw new Error('Invalid repository name.');
  return name.toLowerCase().endsWith('.github.io') ? '/' : `/${name}/`;
}
