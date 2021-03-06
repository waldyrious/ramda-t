const { anyPass, curry, equals, invoker, pipe, reject, replace } = require('ramda')
const path = require('path')
const isMyFile = require('./is-my-file')
const debug = require('debug')('ramda-t')
const wrapRamda = require('./wrap-ramda')
const stackChain = require('stack-chain')
const { spawnSync } = require('child_process')

const relativeTo = curry((a, rest) => path.join(a, ...rest))
const writeLn = curry((stream, str) => stream.write(str + '\n'))
const PACKAGE_ROOT = path.resolve(__dirname, '..')
const relative = relativeTo(PACKAGE_ROOT)

const GENERATE_BIN   = relative([ 'bin', 'generate-json' ])
const JSON_DOCS_PATH = relative([ 'ramda.json' ])
const RAMDA_SOURCE   = relative([ '..', 'ramda', 'dist', 'ramda.js' ])

const generateSync = (ramdajs, dest) => {
  const { stdout, stderr } = spawnSync(GENERATE_BIN, [
    ramdajs,
    dest
  ])

  debug('generate output', {
    stdout: stdout.toString(),
    stderr: stderr.toString()
  })
}

const requireOrGenDocs = (p, ramdajs) => {
  try {
    return require(p)
  } catch ({code}) {
    if (code === 'MODULE_NOT_FOUND') {
      generateSync(ramdajs, p)
      return requireOrGenDocs(p)
    }
  }
}

const mainRamda = require.main.require('ramda')
const mainRamdaVersion = require.main.require('ramda/package.json').version

const docs = (() => {
  const version = replace(/\./g, '_', mainRamdaVersion)

  try {
    return require(relative(['docs', `v${version}.json`]))
  } catch (e) {
    return requireOrGenDocs(JSON_DOCS_PATH, RAMDA_SOURCE)
  }
})();

const ui = {
  print: writeLn(process.stderr),
  eager: true,
  process
}

module.exports = wrapRamda(ui, docs, mainRamda)

const isStackNoise =
  pipe(invoker(0, 'getFileName'),
       anyPass([
         isMyFile,
         equals('module.js')
       ]))

stackChain.filter.attach((err, frames) =>
  err.__declutterStackTrace
    ? reject(isStackNoise, frames)
    : frames)

Error.stackTraceLimit = 20

debug('ramda-t package root', PACKAGE_ROOT)
debug('ramda version', mainRamdaVersion)
