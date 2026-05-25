/**
 * Lightweight connectivity tracker.
 *
 * `expo-network` is already a dependency — we use it instead of NetInfo
 * to keep the surface area small. Polling is good enough here because
 * the cost of a wrong answer is a single failed retry (which the queue
 * handles), not a UX disaster.
 */

import * as Network from 'expo-network';
import type { ConnectivityState } from './types';

/** One-shot probe — returns the current best-effort online status. */
export async function probeOnline(): Promise<ConnectivityState> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (state.isConnected && state.isInternetReachable !== false) {
      return 'online';
    }
    return 'offline';
  } catch {
    return 'unknown';
  }
}
