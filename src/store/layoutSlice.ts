/**
 * Layout slice — tracks which keyboard layout is currently active.
 * The compiled lookup tables live in src/layout/LayoutEngine.ts; this
 * slice only stores the active layout id and lets consumers read the
 * compiled engine from React Context.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const DEFAULT_LAYOUT_ID = 'synthesia-classic'

export interface LayoutState {
  readonly activeLayoutId: string
}

const initialState: LayoutState = {
  activeLayoutId: DEFAULT_LAYOUT_ID,
}

export const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    setActiveLayout(state, action: PayloadAction<string>) {
      state.activeLayoutId = action.payload
    },
  },
})

export const layoutActions = layoutSlice.actions
export const layoutReducer = layoutSlice.reducer
