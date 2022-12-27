<p align="center">
  <img src="https://user-images.githubusercontent.com/7326800/176276668-106932ec-bde4-4a91-8390-c826bb9d5075.png" alt="Logo" width="90" />
</p>

# Install [Geth][geth] action

![Release version][badge_release_version]
[![Build Status][badge_build]][link_build]
[![License][badge_license]][link_license]

This action installs [geth][geth] and tools (`abigen`, `bootnode`, `clef`, `evm`, `puppeth`, `rlpdump`) into your workflow. It can be run on **Linux** (`ubuntu-latest`), **macOS** (`macos-latest`), or **Windows** (`windows-latest`).

- 🚀 Geth downloads page: <https://geth.ethereum.org/downloads/>

Additionally, this action uses GitHub **caching mechanism** to speed up your workflow execution time!

## Usage

```yaml
jobs:
  install-geth-tools:
    runs-on: ubuntu-20.04
    steps:
      - uses: gacts/install-geth-tools@v1
        #with:
        #  version: 1.10.19 # `latest` by default, but you can set a specific version to install, e.g.: `1.10.19`

      - run: geth version
      - run: abigen --version
      - run: bootnode -h
      - run: clef --version
      - run: evm --version
      - run: puppeth --version
      - run: rlpdump -h
```

## Customizing

### Inputs

Following inputs can be used as `step.with` keys:

| Name           |   Type   |        Default        | Required | Description                                                          |
|----------------|:--------:|:---------------------:|:--------:|----------------------------------------------------------------------|
| `version`      | `string` |       `latest`        |    no    | Version to install                                                   |
| `github-token` | `string` | `${{ github.token }}` |    no    | GitHub token (for requesting the latest version info & release hash) |

## Releasing

New versions releasing scenario:

- Make required changes in the [changelog](CHANGELOG.md) file
- Build the action distribution (`make build` or `yarn build`)
- Commit and push changes (including `dist` directory changes - this is important) into the `master` branch
- Publish new release using repo releases page (git tag should follow `vX.Y.Z` format)

Major and minor git tags (`v1` and `v1.2` if you publish `v1.2.Z` release) will be updated automatically.

## Support

[![Issues][badge_issues]][link_issues]
[![Issues][badge_pulls]][link_pulls]

If you find any action errors, please, [make an issue][link_create_issue] in the current repository.

## License

This is open-sourced software licensed under the [MIT License][link_license].

[badge_build]:https://img.shields.io/github/actions/workflow/status/gacts/install-geth-tools/tests.yml?branch=master&maxAge=30
[badge_release_version]:https://img.shields.io/github/release/gacts/install-geth-tools.svg?maxAge=30
[badge_license]:https://img.shields.io/github/license/gacts/install-geth-tools.svg?longCache=true
[badge_release_date]:https://img.shields.io/github/release-date/gacts/install-geth-tools.svg?maxAge=180
[badge_commits_since_release]:https://img.shields.io/github/commits-since/gacts/install-geth-tools/latest.svg?maxAge=45
[badge_issues]:https://img.shields.io/github/issues/gacts/install-geth-tools.svg?maxAge=45
[badge_pulls]:https://img.shields.io/github/issues-pr/gacts/install-geth-tools.svg?maxAge=45

[link_build]:https://github.com/gacts/install-geth-tools/actions
[link_license]:https://github.com/gacts/install-geth-tools/blob/master/LICENSE
[link_issues]:https://github.com/gacts/install-geth-tools/issues
[link_create_issue]:https://github.com/gacts/install-geth-tools/issues/new
[link_pulls]:https://github.com/gacts/install-geth-tools/pulls

[geth]:https://geth.ethereum.org/
