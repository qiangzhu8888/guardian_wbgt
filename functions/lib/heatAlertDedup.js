'use strict';

const { LEVEL_ORDER } = require('./wbgtSensorEvaluate');

/** @typedef {{ rank?: number, ts?: number }} DedupSnap */

/**
 * @param {DedupSnap|unknown | null | undefined} prevState
 * @param {string} worstLevelNew
 * @returns {{ send: boolean, nextState: { rank: number, ts: number } }}
 */
function shouldSendDedup(prevState, worstLevelNew, cooldownMs) {
  const curRank = LEVEL_ORDER[worstLevelNew];
  if (!Number.isFinite(curRank)) {
    const snap =
      typeof prevState === 'object' && prevState !== null
        ? { rank: prevState.rank, ts: prevState.ts }
        : {};
    return { send: false, nextState: snap };
  }

  /** @type {DedupSnap} */
  const st =
    typeof prevState === 'object' && prevState !== null
      ? { rank: prevState.rank, ts: prevState.ts }
      : {};

  if (!Number.isFinite(st.rank ?? NaN)) {
    return { send: true, nextState: { rank: curRank, ts: Date.now() } };
  }

  if (curRank < st.rank) {
    return { send: true, nextState: { rank: curRank, ts: Date.now() } };
  }

  if (curRank === st.rank) {
    if (st.ts != null && Date.now() - st.ts < cooldownMs) {
      return { send: false, nextState: { rank: curRank, ts: st.ts } };
    }
    return { send: true, nextState: { rank: curRank, ts: Date.now() } };
  }

  return { send: false, nextState: { rank: curRank, ts: st.ts != null ? st.ts : Date.now() } };
}

module.exports = { shouldSendDedup };
