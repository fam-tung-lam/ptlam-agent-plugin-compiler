interface ChangelogSection {
  readonly body: string;
  readonly date: string | undefined;
  readonly version: string;
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readSections(changelog: string): readonly ChangelogSection[] {
  const headings = [
    ...changelog.matchAll(/^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?$/gm),
  ];
  return headings.map((heading, index) => {
    const start = (heading.index ?? 0) + heading[0].length;
    const nextHeading = headings[index + 1];
    const linkDefinitions = changelog.slice(start).search(/^\[[^\]]+\]:/m);
    const candidates = [
      nextHeading?.index,
      linkDefinitions === -1 ? undefined : start + linkDefinitions,
      changelog.length,
    ].filter((value): value is number => value !== undefined);
    return {
      body: changelog.slice(start, Math.min(...candidates)).trim(),
      date: heading[2],
      version: heading[1] as string,
    };
  });
}

function requireSection(changelog: string, version: string): ChangelogSection {
  const section = readSections(changelog).find(
    (candidate) => candidate.version === version,
  );
  if (section === undefined) {
    throw new Error(`CHANGELOG.md has no release section for ${version}.`);
  }
  return section;
}

function requireComparisonLink(
  changelog: string,
  label: string,
  comparison: string,
): void {
  const pattern = new RegExp(
    `^\\[${escapeRegularExpression(label)}\\]:\\s*\\n?\\s*https://github\\.com/[^\\s]+/compare/${escapeRegularExpression(comparison)}\\s*$`,
    "m",
  );
  if (!pattern.test(changelog)) {
    throw new Error(
      `CHANGELOG.md has no ${label} comparison link for ${comparison}.`,
    );
  }
}

export function extractReleaseNotes(
  changelog: string,
  version: string,
): string {
  const section = requireSection(changelog, version);
  if (section.date === undefined) {
    throw new Error(`CHANGELOG.md release ${version} has no release date.`);
  }
  if (section.body.length === 0) {
    throw new Error(`CHANGELOG.md release ${version} has no release notes.`);
  }
  return `${section.body}\n`;
}

export function validateReleaseChangelog(
  changelog: string,
  previousVersion: string,
  releaseVersion: string,
): void {
  const unreleased = requireSection(changelog, "Unreleased");
  if (unreleased.body.length > 0) {
    throw new Error(
      "CHANGELOG.md Unreleased must be empty in a release pull request.",
    );
  }
  extractReleaseNotes(changelog, releaseVersion);
  requireComparisonLink(changelog, "Unreleased", `v${releaseVersion}...HEAD`);
  requireComparisonLink(
    changelog,
    releaseVersion,
    `v${previousVersion}...v${releaseVersion}`,
  );
}
