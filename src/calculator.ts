export type AngleMode = 'DEG' | 'RAD';

function toRad(val: number, mode: AngleMode): number {
  return mode === 'DEG' ? (val * Math.PI) / 180 : val;
}

function fromRad(val: number, mode: AngleMode): number {
  return mode === 'DEG' ? (val * 180) / Math.PI : val;
}

function factorial(n: number): number {
  if (n < 0) throw new Error('Factorial of negative number');
  if (!Number.isInteger(n)) throw new Error('Factorial of non-integer');
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function evaluate(expr: string, mode: AngleMode): number {
  // Replace constants
  let e = expr
    .replace(/π/g, String(Math.PI))
    .replace(/e(?![0-9])/g, String(Math.E))
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  // Replace scientific functions with JS equivalents
  e = e.replace(/sin\(/g, '__sin(');
  e = e.replace(/cos\(/g, '__cos(');
  e = e.replace(/tan\(/g, '__tan(');
  e = e.replace(/asin\(/g, '__asin(');
  e = e.replace(/acos\(/g, '__acos(');
  e = e.replace(/atan\(/g, '__atan(');
  e = e.replace(/sinh\(/g, '__sinh(');
  e = e.replace(/cosh\(/g, '__cosh(');
  e = e.replace(/tanh\(/g, '__tanh(');
  e = e.replace(/log\(/g, '__log(');
  e = e.replace(/ln\(/g, '__ln(');
  e = e.replace(/√\(/g, '__sqrt(');
  e = e.replace(/√([0-9.]+)/g, '__sqrt($1)');
  e = e.replace(/cbrt\(/g, '__cbrt(');
  e = e.replace(/abs\(/g, '__abs(');
  e = e.replace(/\^/g, '**');
  e = e.replace(/(\d+)!/g, '__fact($1)');

  const __sin = (x: number) => Math.sin(toRad(x, mode));
  const __cos = (x: number) => Math.cos(toRad(x, mode));
  const __tan = (x: number) => Math.tan(toRad(x, mode));
  const __asin = (x: number) => fromRad(Math.asin(x), mode);
  const __acos = (x: number) => fromRad(Math.acos(x), mode);
  const __atan = (x: number) => fromRad(Math.atan(x), mode);
  const __sinh = Math.sinh;
  const __cosh = Math.cosh;
  const __tanh = Math.tanh;
  const __log = Math.log10;
  const __ln = Math.log;
  const __sqrt = Math.sqrt;
  const __cbrt = Math.cbrt;
  const __abs = Math.abs;
  const __fact = factorial;

  // eslint-disable-next-line no-new-func
  const fn = new Function(
    '__sin', '__cos', '__tan', '__asin', '__acos', '__atan',
    '__sinh', '__cosh', '__tanh', '__log', '__ln', '__sqrt',
    '__cbrt', '__abs', '__fact',
    `"use strict"; return (${e});`
  );

  const result = fn(
    __sin, __cos, __tan, __asin, __acos, __atan,
    __sinh, __cosh, __tanh, __log, __ln, __sqrt,
    __cbrt, __abs, __fact
  );

  if (typeof result !== 'number') throw new Error('Invalid expression');
  return result;
}

export function formatResult(val: number): string {
  if (!isFinite(val)) return isNaN(val) ? 'Error' : val > 0 ? 'Infinity' : '-Infinity';
  if (Number.isInteger(val) && Math.abs(val) < 1e15) return String(val);
  // Use toPrecision for scientific notation cutoff
  const abs = Math.abs(val);
  if (abs < 1e-7 || abs >= 1e12) {
    return val.toExponential(8).replace(/\.?0+e/, 'e');
  }
  const str = parseFloat(val.toPrecision(12)).toString();
  return str;
}
