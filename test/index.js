const { add, assoc, identity, multiply } = require('ramda')
const R = require('ramda')
const { eq, assert } = require('./utils')
const { doesNotThrow, throws } = assert
const sinon = require('sinon')
const noop = () => {}
const wrapRamda = require('../src/wrap-ramda')
const baseUI = {
  process: { stdout: { columns: 30 } },
  print: noop
}

const wrap = wrapRamda(baseUI)

it('handles any type (*)', () => {
  const docs = [{
    args: [ { types: [ '*' ] } ],
    name: 'empty'
  }]
  
  const { empty } = wrap(docs, R)

  doesNotThrow(() => {
    empty('foo')
    empty([])
    empty(1)
  })
})

it('handles multiple types', () => {
  const docs = [{
    args: [ { types: [ 'String', 'Array' ] } ],
    name: 'reverse'
  }]
  
  const { reverse } = wrap(docs, R)

  doesNotThrow(() => {
    reverse('foo')
    reverse([])
  })

  throws(() => reverse(1))
})

it('handles variadic functions', () => {
  const docs = [{
    args: [{
      variable: true,
      types: ['Function']
    }],
    name: 'pipe'
  }]
  
  const { pipe } = wrap(docs, R)

  doesNotThrow(() => {
    eq(pipe(add(1), multiply(2))(1), 4)
  })

  throws(() => pipe(identity, 1))
})

it('checks if a value is dispatchable if type does not match', () => {
  const docs = [{
    args: [
      { types: ['Function'] },
      { types: ['Array'] }
    ],
    name: 'map'
  }]
  
  const { map } = wrap(docs, R)

  doesNotThrow(() => map(identity, { map: noop }))
  throws(() => map(identity, { foo: noop }))
})

it('throws when passing an undefined to trigger invalid type', () => {
  const docs = [{
    args: [ { types: [ 'Array' ] } ],
    name: 'head'
  }]
  
  const { head } = wrap(docs, R)
  throws(() => head(undefined))
})

it('calls passed print function on invalid type', () => {
  const docs = [{
    args: [ { types: [ 'Array' ] } ],
    name: 'head'
  }]

  const print = sinon.spy()
  const ui = assoc('print', print, baseUI)
  const { head } = wrapRamda(ui, docs, R)
  throws(() => head(undefined))
  sinon.assert.called(print)
})
