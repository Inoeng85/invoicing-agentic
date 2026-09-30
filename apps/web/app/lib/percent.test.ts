import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { formatPercentInput, parsePercentInput } from './percent.ts'

describe('percent input', () => {
  it('parses dot and comma decimals into a fraction', () => {
    assert.equal(parsePercentInput('10'), 0.1)
    assert.equal(parsePercentInput('7,5'), 0.075)
    assert.equal(parsePercentInput(' 7.5 '), 0.075)
  })

  it('returns NaN for empty or non-numeric input so the domain rejects it', () => {
    assert.ok(Number.isNaN(parsePercentInput('')))
    assert.ok(Number.isNaN(parsePercentInput('abc')))
  })

  it('formats a fraction back to a percent string', () => {
    assert.equal(formatPercentInput(0.075), '7.5')
    assert.equal(formatPercentInput(0.1), '10')
  })
})
