/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
export const script = async ({ context, github }) => {
  const { data: listReleases } = await github.rest.repos.listReleases({
    owner: context.repo.owner,
    repo: context.repo.repo,
  });

  const [release] = listReleases;
  if (release.draft) {
    console.log("Skipping release creation as there is already a draft");
    console.log("Reusing:", release.id);
    return release.id;
  }

  const { data } = await github.rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: `v${process.env.PACKAGE_VERSION}`,
    name: `Overlayed v${process.env.PACKAGE_VERSION}`,
    body: "release notes here",
    draft: true,
    prerelease: false,
  });
  console.log("Created release with id:", data.id);
  return data.id;
};
