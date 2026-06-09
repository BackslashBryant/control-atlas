#!/usr/bin/env node
/**
 * Resolve manifest source tier to a fetch URL and trust metadata.
 * Order: Gold Git → Gold web → Silver Git → Silver web → Bronze Git → Bronze web
 */

const TIER_ORDER = ['gold', 'silver', 'bronze'];

function rawGitUrl(gitEntry) {
  if (!gitEntry?.repo || !gitEntry?.path) return null;
  const ref = gitEntry.ref || 'main';
  const repo = gitEntry.repo.replace(/\/$/, '');
  if (repo.includes('raw.githubusercontent.com')) {
    return `${repo}/${ref}/${gitEntry.path}`;
  }
  const base = repo.replace('https://github.com/', 'https://raw.githubusercontent.com/');
  return `${base}/${ref}/${gitEntry.path}`;
}

/**
 * @param {object} source - manifest source entry
 * @param {object} [options]
 * @param {boolean} [options.allowBronze=true]
 * @param {boolean} [options.allowCommunityGit=true]
 */
export function resolveSourceTier(source, options = {}) {
  const allowBronze = options.allowBronze !== false;
  const allowCommunityGit = options.allowCommunityGit !== false;

  if (!source) throw new Error('resolveSourceTier: source is required');
  if (source.source_tier === 'gold' && source.resolved_from === 'bronze') {
    throw new Error('manifest cannot claim gold source_tier with bronze resolved_from');
  }

  for (const tier of TIER_ORDER) {
    if (tier === 'bronze' && !allowBronze) continue;

    const gitKey = tier;
    const gitEntry = source.source_git?.[gitKey] || source.source_git?.[`${tier}_derived`];
    if (gitEntry) {
      if (tier === 'bronze' && !allowCommunityGit) continue;
      const url = rawGitUrl(gitEntry);
      if (url) {
        return trustForTier(tier, url, source);
      }
    }

    const webUrl = source.source_urls?.[tier];
    if (webUrl && webUrl !== 'none') {
      if (tier === 'bronze' && !allowBronze) continue;
      return trustForTier(tier, webUrl, source);
    }
  }

  if (source.source) {
    return trustForTier(source.resolved_from || source.source_tier || 'manual', source.source, source);
  }

  throw new Error(`no resolvable URL for source ${source.name || 'unknown'}`);
}

function trustForTier(tier, url, source) {
  const isBronze = tier === 'bronze';
  return {
    tier,
    url,
    authoritative: isBronze ? false : source.authoritative !== false,
    source_trust: isBronze ? 'public-fallback' : source.source_trust || 'authoritative',
    commit_pin: source.source_git?.bronze?.commit_pin || source.source_git?.gold?.commit_pin || null,
  };
}

export function buildRawGitUrl(repo, path, ref = 'main') {
  return rawGitUrl({ repo, path, ref });
}
