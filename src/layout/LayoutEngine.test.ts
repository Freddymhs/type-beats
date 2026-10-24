import { describe, expect, it } from 'vitest'

import { midiPitch } from '../types/index.ts'
import { LayoutEngine, SYNTHESIA_CLASSIC_LAYOUT } from './index.ts'

const C4 = midiPitch(60)

describe('LayoutEngine — Synthesia Classic', () => {
  const engine = new LayoutEngine(SYNTHESIA_CLASSIC_LAYOUT)

  it('maps "s" to C4 (acceptance criterion, BUG-046: left-hand row starts at S)', () => {
    expect(engine.getNote('s')).toBe(C4)
  })

  it('maps "d" to D4', () => {
    expect(engine.getNote('d')).toBe(midiPitch(62))
  })

  it('maps "g" to F4 (left-hand last column)', () => {
    expect(engine.getNote('g')).toBe(midiPitch(65))
  })

  it('maps "z" to C3 (bottom row octave 3, BUG-046)', () => {
    expect(engine.getNote('z')).toBe(midiPitch(48))
  })

  it('maps "w" to C5 (BUG-046: top row first key)', () => {
    expect(engine.getNote('w')).toBe(midiPitch(72))
  })

  it('does NOT map the gap keys (y, h, b)', () => {
    expect(engine.getNote('y')).toBeUndefined()
    expect(engine.getNote('h')).toBeUndefined()
    expect(engine.getNote('b')).toBeUndefined()
  })

  it('reverses the lookup via getKey (BUG-046: S now maps to C4)', () => {
    expect(engine.getKey(C4)).toBe('s')
  })

  it('returns undefined for unmapped keys', () => {
    // 6, 7, 8, ;, -, =, ., / remain unmapped after BUG-044.
    expect(engine.getNote('6')).toBeUndefined()
    expect(engine.getNote(';')).toBeUndefined()
    expect(engine.getNote('/')).toBeUndefined()
    expect(engine.getNote('.')).toBeUndefined()
  })

  it('maps octave 5 white keys (per BUG-036 + BUG-046)', () => {
    // W,E,R,T cover the lower octave half; U,I,O cover the upper half.
    expect(engine.getKey(midiPitch(72))).toBe('w') // C5
    expect(engine.getKey(midiPitch(77))).toBe('t') // F5
    expect(engine.getKey(midiPitch(79))).toBe('u') // G5
    expect(engine.getKey(midiPitch(81))).toBe('i') // A5
    expect(engine.getKey(midiPitch(83))).toBe('o') // B5
  })

  it('does NOT map octave 6+ keys', () => {
    expect(engine.getKey(midiPitch(84))).toBeUndefined() // C6
    expect(engine.getKey(midiPitch(86))).toBeUndefined() // D6
    expect(engine.getKey(midiPitch(88))).toBeUndefined() // E6
  })

  it('recognizes modifier keys', () => {
    expect(engine.isModifier('\\')).toBe(true)
    expect(engine.isModifier("'")).toBe(true)
    expect(engine.isModifier('1')).toBe(true)
    expect(engine.isModifier('a')).toBe(false)
    expect(engine.isModifier('f')).toBe(false)
  })

  it('returns modifier actions', () => {
    expect(engine.getModifier('\\')).toBe('toggle-falling-notes')
    expect(engine.getModifier("'")).toBe('toggle-notation')
    expect(engine.getModifier('1')).toBe('timbre-1')
  })

  it('tags white keys as "white" group', () => {
    expect(engine.getGroup('s')).toBe('white')
    expect(engine.getGroup('z')).toBe('white')
    expect(engine.getGroup('w')).toBe('white')
  })

  it('tags top-row keys W/E/R/T/U/I/O as "white" (BUG-046)', () => {
    expect(engine.getGroup('w')).toBe('white')
    expect(engine.getGroup('e')).toBe('white')
    expect(engine.getGroup('r')).toBe('white')
    expect(engine.getGroup('t')).toBe('white')
    expect(engine.getGroup('u')).toBe('white')
    expect(engine.getGroup('i')).toBe('white')
    expect(engine.getGroup('o')).toBe('white')
  })

  it('tags modifier keys as "modifier" group', () => {
    expect(engine.getGroup('\\')).toBe('modifier')
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
