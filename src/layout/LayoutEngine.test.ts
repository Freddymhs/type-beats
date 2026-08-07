import { describe, expect, it } from 'vitest'

import { midiPitch } from '../types/index.ts'
import { LayoutEngine, SYNTHESIA_CLASSIC_LAYOUT } from './index.ts'

const C4 = midiPitch(60)

describe('LayoutEngine — Synthesia Classic', () => {
  const engine = new LayoutEngine(SYNTHESIA_CLASSIC_LAYOUT)

  it('maps "a" to C4 (acceptance criterion)', () => {
    expect(engine.getNote('a')).toBe(C4)
  })

  it('maps "s" to D4', () => {
    expect(engine.getNote('s')).toBe(midiPitch(62))
  })

  it('maps "g" to G4 (home row boundary)', () => {
    expect(engine.getNote('g')).toBe(midiPitch(67))
  })

  it('maps "z" to C3 (bottom row octave 3)', () => {
    expect(engine.getNote('z')).toBe(midiPitch(48))
  })

  it('maps "w" to C#4 (black key on top row)', () => {
    expect(engine.getNote('w')).toBe(midiPitch(61))
  })

  it('reverses the lookup via getKey', () => {
    expect(engine.getKey(C4)).toBe('a')
  })

  it('returns undefined for unmapped keys', () => {
    expect(engine.getNote('q')).toBeUndefined()
  })

  it('recognizes modifier keys', () => {
    expect(engine.isModifier('f')).toBe(true)
    expect(engine.isModifier('a')).toBe(false)
  })

  it('returns modifier actions', () => {
    expect(engine.getModifier('f')).toBe('toggle-falling-notes')
    expect(engine.getModifier('1')).toBe('timbre-1')
  })

  it('tags white keys as "white" group', () => {
    expect(engine.getGroup('a')).toBe('white')
    expect(engine.getGroup('z')).toBe('white')
  })

  it('tags black keys as "black" group', () => {
    expect(engine.getGroup('w')).toBe('black')
    expect(engine.getGroup('u')).toBe('black')
  })

  it('tags modifier keys as "modifier" group', () => {
    expect(engine.getGroup('f')).toBe('modifier')
    expect(engine.getGroup(' ')).toBe('modifier')
    expect(engine.getGroup('1')).toBe('modifier')
  })

  it('reports layout id and name', () => {
    expect(engine.getId()).toBe('synthesia-classic')
    expect(engine.getName()).toContain('Synthesia Classic')
  })
})

describe('LayoutEngine — empty layout', () => {
  const engine = new LayoutEngine({
    id: 'empty',
    name: 'empty',
    mappings: {},
    modifiers: {},
    groups: {},
  })

  it('returns undefined for any key', () => {
    expect(engine.getNote('a')).toBeUndefined()
  })

  it('does not flag any modifier', () => {
    expect(engine.isModifier('Shift+f')).toBe(false)
    expect(engine.isModifier('1')).toBe(false)
  })
})
