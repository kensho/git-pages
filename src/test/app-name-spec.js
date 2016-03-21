var la = require('lazy-ass')
import getAppName from '../app-name'
import check from 'check-more-types'

/* global describe, it */
describe('app-name', () => {
  it('is a function', () => {
    la(check.fn(getAppName))
  })

  it('returns expected output', () => {
    const url = 'http://localhost:8765/foo-bar'
    const name = getAppName(url)
    la(name === 'foo-bar')
  })

  it('does not care about trailing slash', () => {
    const url = 'http://localhost:8765/foo/'
    const name = getAppName(url)
    la(name === 'foo')
  })

  it('only returns first app name', () => {
    const url = 'http://localhost:8765/foo/bar'
    const name = getAppName(url)
    la(name === 'foo')
  })

  it('throws error for invalid urls', () => {
    const badUrl = 'localhost:8765/foo'
    la(check.raises(() => {
      getAppName(badUrl)
    }))
  })
})
