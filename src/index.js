const core = require('@actions/core') // docs: https://github.com/actions/toolkit/tree/main/packages/core
const tc = require('@actions/tool-cache') // docs: https://github.com/actions/toolkit/tree/main/packages/tool-cache
const github = require('@actions/github') // docs: https://github.com/actions/toolkit/tree/main/packages/github
const io = require('@actions/io') // docs: https://github.com/actions/toolkit/tree/main/packages/io
const cache = require('@actions/cache') // docs: https://github.com/actions/toolkit/tree/main/packages/cache
const exec = require('@actions/exec') // docs: https://github.com/actions/toolkit/tree/main/packages/exec
const glob = require('@actions/glob') // docs: https://github.com/actions/toolkit/tree/main/packages/glob
const path = require('path')
const os = require('os')

// read action inputs
const input = {
  version: core.getInput('version', {required: true}).replace(/^v/, ''), // strip the 'v' prefix
  githubToken: core.getInput('github-token'),
}

// main action entrypoint
async function runAction() {
  let version

  if (input.version.toLowerCase() === 'latest') {
    core.debug('Requesting latest Geth version...')
    version = await getLatestGethVersion(input.githubToken)
  } else {
    version = input.version
  }

  core.startGroup('💾 Install Geth')
  await doInstall(version)
  core.endGroup()

  core.startGroup('🧪 Installation check')
  await doCheck()
  core.endGroup()
}

/**
 * @param {string} version
 *
 * @returns {Promise<void>}
 *
 * @throws
 */
async function doInstall(version) {
  const pathToInstall = path.join(os.tmpdir(), `geth-${version}`)
  const cacheKey = `geth-cache-${version}-${process.platform}-${process.arch}`

  core.info(`Version to install: ${version} (target directory: ${pathToInstall})`)

  let restoredFromCache = undefined

  try {
    restoredFromCache = await cache.restoreCache([pathToInstall], cacheKey)
  } catch (e) {
    core.warning(e)
  }

  if (restoredFromCache !== undefined) { // cache HIT
    core.info(`👌 Geth restored from cache`)
  } else { // cache MISS
    const versionCommitHash = await getVersionCommitHash(input.githubToken, version)
    const distUri = getGethURI(process.platform, process.arch, version, versionCommitHash)
    const pathToUnpack = path.join(os.tmpdir(), `geth.tmp`)
    const distPath = await tc.downloadTool(distUri)

    switch (true) {
      case distUri.endsWith('tar.gz'):
        await tc.extractTar(distPath, pathToUnpack)
        break

      case distUri.endsWith('zip'):
        await tc.extractZip(distPath, pathToUnpack)
        break

      default:
        throw new Error('Unsupported distributive format')
    }

    await io.rmRF(distPath)

    for await (const filePath of (await glob.create(path.join(pathToUnpack, '**', '*'), {
      matchDirectories: false,
    })).globGenerator()) {
      await io.mv(filePath, path.join(pathToInstall, path.basename(filePath)))
    }

    try {
      await cache.saveCache([pathToInstall], cacheKey)
    } catch (e) {
      core.warning(e)
    }
  }

  core.addPath(pathToInstall)
}

/**
 * @returns {Promise<void>}
 *
 * @throws
 */
async function doCheck() {
  const gethBinPath = await io.which('geth', true)

  if (gethBinPath === "") {
    throw new Error('geth binary file not found in $PATH')
  }

  await exec.exec('geth', ['version'], {silent: true})

  core.info(`Geth installed: ${gethBinPath}`)
}

/**
 * @param {string} githubAuthToken
 * @returns {Promise<string>}
 */
async function getLatestGethVersion(githubAuthToken) {
  // docs: https://octokit.github.io/rest.js/v18#repos-get-latest-release
  const latest = await github.getOctokit(githubAuthToken).rest.repos.getLatestRelease({
    owner: 'ethereum',
    repo: 'go-ethereum',
  })

  return latest.data.tag_name.replace(/^v/, '') // strip the 'v' prefix
}

/**
 * @param {string} githubAuthToken
 * @param {string} version
 * @returns {Promise<string>}
 */
async function getVersionCommitHash(githubAuthToken, version) {
  // docs: https://octokit.github.io/rest.js/v18#git-get-ref
  const ref = await github.getOctokit(githubAuthToken).rest.git.getRef({
    owner: 'ethereum',
    repo: 'go-ethereum',
    ref: 'tags/v' + version,
  })

  return ref.data.object.sha
}

/**
 * @link https://github.com/ethereum/go-ethereum/releases
 * @link https://geth.ethereum.org/downloads/
 *
 * @param {('linux'|'darwin'|'win32')} platform
 * @param {('x32'|'x64'|'arm'|'arm64')} arch
 * @param {string} version E.g.: `1.10.15`
 * @param {string} versionCommitHash Eg.: `8be800ffa9c4992666e2620e0ab4725a1a83352b`
 *
 * @returns {string}
 *
 * @throws
 */
function getGethURI(platform, arch, version, versionCommitHash) {
  const shortHash = versionCommitHash.substring(0, 8)

  switch (platform) {
    case 'linux': {
      switch (arch) {
        case 'x64': // Amd64
          return `https://gethstore.blob.core.windows.net/builds/geth-alltools-linux-amd64-${version}-${shortHash}.tar.gz`

        case 'x32':
          return `https://gethstore.blob.core.windows.net/builds/geth-alltools-linux-386-${version}-${shortHash}.tar.gz`

        case 'arm64':
          return `https://gethstore.blob.core.windows.net/builds/geth-alltools-linux-arm64-${version}-${shortHash}.tar.gz`
      }

      throw new Error(`Unsupported linux architecture '${arch}'.`)
    }

    case 'darwin': {
      switch (arch) {
        case 'x64':
          return `https://gethstore.blob.core.windows.net/builds/geth-alltools-darwin-amd64-${version}-${shortHash}.tar.gz`

        case 'arm64':
          return `https://gethstore.blob.core.windows.net/builds/geth-alltools-darwin-arm64-${version}-${shortHash}.tar.gz`;
      }

      throw new Error(`Unsupported MacOS architecture '${arch}'.`)
    }

    case 'win32': {
      switch (arch) {
        case 'x64': // Amd64
          return `https://gethstore.blob.core.windows.net/builds/geth-alltools-windows-amd64-${version}-${shortHash}.zip`

        case 'x32': // 386
          return `https://gethstore.blob.core.windows.net/builds/geth-alltools-windows-386-${version}-${shortHash}.zip`
      }

      throw new Error(`Unsupported windows architecture '${arch}'.`)
    }
  }

  throw new Error('Unsupported OS (platform)')
}

// run the action
(async () => {
  await runAction()
})().catch(error => {
  core.setFailed(error.message)
})
