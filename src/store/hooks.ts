/**
 * Typed Redux hooks — DRY helpers so consumers don't have to retype
 * the RootState / AppDispatch generics at every use.
 */

import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'

import type { AppDispatch, RootState } from './index.ts'

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
