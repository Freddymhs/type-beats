/**
 * timbreRegistry — per-timbre signal-chain extensions.
 *
 * The base `Timbre` shape (src/types/music.ts) is pure JSON-serializable data
 * so it can ride through Dexie + Redux. Anything that needs a real Tone.js
 * node (filters, LFOs, effect chains) is registered here keyed by timbre id.
 *
 * `swapSynth()` in ToneManager looks up the spec after constructing the
 * PolySynth and calls `buildChain(synth)` to wire extra nodes. The hot-key
 * handler (Alt+1..5) maps digit to the corresponding timbre id from
 * DEFAULT_TIMBRES order.
 *
 * Ocarina spec (per docs/_CONCEPTO.md):
 *   sine carrier + vibrato LFO + lowpass filter for a soft, breathy tone.
 */

import * as Tone from 'tone'

export interface TimbreSpec {
  readonly id: string
  readonly buildChain: (synth: Tone.PolySynth<Tone.Synth>) => void
}

const OCARINA_FILTER_FREQ = 1800
const OCARINA_VIBRATO_FREQ = 5
// Tone.Vibrato expects amount in [0, 1]; 0.05 = ±5% pitch deviation,
// a subtle breathy warble appropriate for an ocarina timbre.
const OCARINA_VIBRATO_AMOUNT = 0.05

const buildOcarinaChain = (synth: Tone.PolySynth<Tone.Synth>): void => {
  const filter = new Tone.Filter(OCARINA_FILTER_FREQ, 'lowpass')
  const vibrato = new Tone.Vibrato(OCARINA_VIBRATO_FREQ, OCARINA_VIBRATO_AMOUNT)
  synth.chain(vibrato, filter, Tone.Destination)
}

const SPECS: ReadonlyMap<string, TimbreSpec> = new Map([
  ['ocarina', { id: 'ocarina', buildChain: buildOcarinaChain }],
])

export const getTimbreSpec = (id: string): TimbreSpec | undefined => SPECS.get(id)

/**
 * Mapping from `Alt+digit` (1..5) to a Timbre id, by position in
 * DEFAULT_TIMBRES. The list order matches the docs/_CONCEPTO.md spec:
 *   Alt+1 square, Alt+2 triangle, Alt+3 sineFlute, Alt+4 saw, Alt+5 ocarina.
 */
export const TIMBRE_HOTKEY_DIGITS: ReadonlyArray<string> = ['1', '2', '3', '4', '5']
