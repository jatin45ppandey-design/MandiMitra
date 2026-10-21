import type { MandiSnapshot } from '../types/mandi'

export async function readBundledSnapshot(): Promise<MandiSnapshot> {
  const response = await fetch('/data/mandi-snapshot.json')
  if (!response.ok) throw new Error('No local mandi snapshot available')
  const snapshot: unknown = await response.json()
  if (
    typeof snapshot !== 'object' ||
    snapshot === null ||
    !('metadata' in snapshot) ||
    !('records' in snapshot) ||
    !Array.isArray(snapshot.records)
  ) {
    throw new Error('Invalid mandi snapshot schema')
  }
  return snapshot as MandiSnapshot
}

