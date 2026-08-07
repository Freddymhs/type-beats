import { describe, expect, it } from 'vitest'

import { getTimbreSpec, TIMBRE_HOTKEY_DIGITS } from './timbreRegistry.ts'

describe('timbreRegistry', () => {
  it('returns a spec for ocarina with a buildChain', () => {
    const spec = getTimbreSpec('ocarina')
    expect(spec).toBeDefined()
    expect(spec?.buildChain).toBeInstanceOf(Function)
  })

  it('returns undefined for plain oscillator timbres', () => {
    expect(getTimbreSpec('square')).toBeUndefined()
    expect(getTimbreSpec('triangle')).toBeUndefined()
    expect(getTimbreSpec('sineFlute')).toBeUndefined()
    expect(getTimbreSpec('saw')).toBeUndefined()
  })

  it('exposes 5 hotkey digits', () => {
    expect(TIMBRE_HOTKEY_DIGITS).toEqual(['1', '2', '3', '4', '5'])
  })
})
