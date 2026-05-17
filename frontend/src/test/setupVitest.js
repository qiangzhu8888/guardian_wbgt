/**
 * SSR 相当の Vitest で react-router の Link が console.error を吐すのを抑制（テスト結果のノイズ削減）。
 */
const suppressed = /useLayoutEffect does nothing on the server/i;

const origError = console.error.bind(console);
console.error = (...args) => {
  const first = args[0];
  if (typeof first === 'string' && suppressed.test(first)) return;
  origError(...args);
};
