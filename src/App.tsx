import { useState, useCallback, useEffect, useRef } from 'react';
import { Delete, Clock, X } from 'lucide-react';
import { evaluate, formatResult, AngleMode } from './calculator';

interface HistoryEntry {
  expression: string;
  result: string;
}

type ShiftMode = 'normal' | 'shift';
type BtnVariant = 'number' | 'operator' | 'function' | 'equals' | 'clear' | 'memory' | 'utility' | 'shift-active';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [liveResult, setLiveResult] = useState('');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [shift, setShift] = useState<ShiftMode>('normal');
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [error, setError] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  const tryLiveEval = useCallback((expr: string) => {
    if (!expr) { setLiveResult(''); return; }
    try {
      const val = evaluate(expr, angleMode);
      const res = formatResult(val);
      setLiveResult(res === expr ? '' : res);
      setError(false);
    } catch {
      setLiveResult('');
    }
  }, [angleMode]);

  const appendToExpr = useCallback((val: string) => {
    setError(false);
    setExpression(prev => {
      let next: string;
      if (justEvaluated && /^[0-9.(πe]/.test(val)) {
        next = val;
      } else {
        next = prev + val;
      }
      setJustEvaluated(false);
      tryLiveEval(next);
      return next;
    });
    setDisplay('');
  }, [justEvaluated, tryLiveEval]);

  const handleEquals = useCallback(() => {
    const expr = expression || display;
    if (!expr || expr === '0') return;
    try {
      const val = evaluate(expr, angleMode);
      const res = formatResult(val);
      setHistory(h => [{ expression: expr, result: res }, ...h].slice(0, 50));
      setExpression('');
      setDisplay(res);
      setLiveResult('');
      setJustEvaluated(true);
      setError(false);
    } catch {
      setError(true);
      setDisplay('Error');
      setLiveResult('');
      setExpression('');
      setJustEvaluated(false);
    }
  }, [expression, display, angleMode]);

  const handleNumber = useCallback((n: string) => {
    setError(false);
    if (justEvaluated) {
      setExpression('');
      setDisplay(n === '.' ? '0.' : n);
      setLiveResult('');
      setJustEvaluated(false);
      return;
    }
    if (expression) {
      appendToExpr(n);
    } else {
      setDisplay(prev => {
        if (prev === '0' && n !== '.') return n;
        if (n === '.' && prev.includes('.')) return prev;
        return prev + n;
      });
    }
  }, [justEvaluated, expression, appendToExpr]);

  const handleOperator = useCallback((op: string) => {
    setError(false);
    setJustEvaluated(false);
    const current = expression || display;
    const next = current + op;
    setExpression(next);
    setDisplay('');
    tryLiveEval(current);
  }, [expression, display, tryLiveEval]);

  const handleFunction = useCallback((fn: string) => {
    setError(false);
    setJustEvaluated(false);
    const next = (expression || '') + fn + '(';
    setExpression(next);
    setDisplay('');
    setShift('normal');
  }, [expression]);

  const handleConstant = useCallback((c: string) => {
    appendToExpr(c);
  }, [appendToExpr]);

  const handleBackspace = useCallback(() => {
    setError(false);
    setJustEvaluated(false);
    if (expression) {
      const next = expression.slice(0, -1);
      setExpression(next);
      tryLiveEval(next);
    } else {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    }
  }, [expression, tryLiveEval]);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setLiveResult('');
    setError(false);
    setJustEvaluated(false);
    setShift('normal');
  }, []);

  const handleMemory = useCallback((action: string) => {
    const current = parseFloat(display || '0') || 0;
    switch (action) {
      case 'MC': setMemory(0); break;
      case 'MR': {
        const m = formatResult(memory);
        setDisplay(m);
        setExpression('');
        setLiveResult('');
        setJustEvaluated(true);
        break;
      }
      case 'MS': setMemory(current); break;
      case 'M+': setMemory(m => m + current); break;
      case 'M-': setMemory(m => m - current); break;
    }
  }, [display, memory]);

  const handleSign = useCallback(() => {
    if (expression) {
      setExpression(prev => {
        const next = prev.startsWith('-') ? prev.slice(1) : '-(' + prev + ')';
        tryLiveEval(next);
        return next;
      });
    } else {
      setDisplay(prev => {
        if (prev === '0') return '0';
        return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
      });
    }
  }, [expression, tryLiveEval]);

  const handlePercent = useCallback(() => {
    const val = parseFloat(expression || display);
    if (isNaN(val)) return;
    const res = formatResult(val / 100);
    setDisplay(res);
    setExpression('');
    setLiveResult('');
    setJustEvaluated(true);
  }, [expression, display]);

  const handleParen = useCallback(() => {
    const expr = expression;
    const opens = (expr.match(/\(/g) || []).length;
    const closes = (expr.match(/\)/g) || []).length;
    appendToExpr(opens > closes ? ')' : '(');
  }, [expression, appendToExpr]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key >= '0' && e.key <= '9') handleNumber(e.key);
      else if (e.key === '.') handleNumber('.');
      else if (e.key === '+') handleOperator('+');
      else if (e.key === '-') handleOperator('−');
      else if (e.key === '*') handleOperator('×');
      else if (e.key === '/') { e.preventDefault(); handleOperator('÷'); }
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') handleClear();
      else if (e.key === '(') appendToExpr('(');
      else if (e.key === ')') appendToExpr(')');
      else if (e.key === '^') appendToExpr('^');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNumber, handleOperator, handleEquals, handleBackspace, handleClear, appendToExpr]);

  const isShift = shift === 'shift';

  // Displayed value: when typing expression, show live result; else show display
  const mainValue = expression
    ? (liveResult || expression)
    : display;

  const mainIsExpr = expression && !liveResult;
  const displayLen = mainValue.length;
  const textSize = displayLen > 14 ? 'text-xl' : displayLen > 10 ? 'text-2xl' : displayLen > 7 ? 'text-3xl' : 'text-4xl';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/70 overflow-hidden border border-slate-700/40">

          {/* Header bar */}
          <div className="flex items-center justify-between px-5 pt-4 pb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            </div>
            <span className="text-slate-500 text-xs font-semibold tracking-widest uppercase select-none">
              Scientific
            </span>
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`transition-colors ${showHistory ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="History"
            >
              <Clock size={15} />
            </button>
          </div>

          {/* Display */}
          <div ref={displayRef} className="px-5 pt-6 pb-4 min-h-[100px] flex flex-col justify-end items-end select-none relative">
            {/* Mode Indicators */}
            <div className="absolute top-3 left-5 flex gap-1.5">
              <div className={`
                px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest border transition-all duration-300
                ${angleMode === 'DEG' 
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]' 
                  : 'bg-transparent border-slate-700/40 text-slate-600'}
              `}>
                DEG
              </div>
              <div className={`
                px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest border transition-all duration-300
                ${angleMode === 'RAD' 
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]' 
                  : 'bg-transparent border-slate-700/40 text-slate-600'}
              `}>
                RAD
              </div>
            </div>
            {/* Expression line */}
            <div className="text-slate-500 text-xs h-5 w-full text-right overflow-x-auto whitespace-nowrap leading-5 mb-1">
              {expression || '\u00A0'}
            </div>
            {/* Main number */}
            <div className={`
              font-light tracking-tight w-full text-right overflow-x-auto whitespace-nowrap
              transition-all duration-75
              ${textSize}
              ${error ? 'text-red-400' : mainIsExpr ? 'text-slate-400' : 'text-white'}
            `}>
              {mainValue}
            </div>
            {/* Memory badge */}
            {memory !== 0 && (
              <div className="text-xs text-cyan-400/60 mt-0.5 tabular-nums">
                M = {formatResult(memory)}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="px-3 pb-4 space-y-1.5">

            {/* Memory row */}
            <div className="grid grid-cols-5 gap-1.5">
              {(['MC','MR','MS','M+','M−'] as const).map(k => (
                <CalcButton key={k} label={k} action={() => handleMemory(k === 'M−' ? 'M-' : k)} variant="memory" />
              ))}
            </div>

            {/* Scientific row 1: trig */}
            <div className="grid grid-cols-5 gap-1.5">
              <CalcButton label={isShift ? 'asin' : 'sin'} action={() => handleFunction(isShift ? 'asin' : 'sin')} variant="function" />
              <CalcButton label={isShift ? 'acos' : 'cos'} action={() => handleFunction(isShift ? 'acos' : 'cos')} variant="function" />
              <CalcButton label={isShift ? 'atan' : 'tan'} action={() => handleFunction(isShift ? 'atan' : 'tan')} variant="function" />
              <CalcButton label={isShift ? 'ln' : 'log'} action={() => handleFunction(isShift ? 'ln' : 'log')} variant="function" />
              <CalcButton label={isShift ? 'eˣ' : '10ˣ'} action={() => isShift ? appendToExpr('e^') : appendToExpr('10^')} variant="function" />
            </div>

            {/* Scientific row 2 */}
            <div className="grid grid-cols-5 gap-1.5">
              <CalcButton label={isShift ? 'sinh' : 'x²'} action={() => isShift ? handleFunction('sinh') : appendToExpr('^2')} variant="function" />
              <CalcButton label={isShift ? 'cosh' : 'x³'} action={() => isShift ? handleFunction('cosh') : appendToExpr('^3')} variant="function" />
              <CalcButton label={isShift ? 'tanh' : 'xʸ'} action={() => isShift ? handleFunction('tanh') : appendToExpr('^')} variant="function" />
              <CalcButton label={isShift ? '∛' : '√'} action={() => isShift ? appendToExpr('cbrt(') : appendToExpr('√(')} variant="function" />
              <CalcButton label={isShift ? '|x|' : 'n!'} action={() => isShift ? handleFunction('abs') : appendToExpr('!')} variant="function" />
            </div>

            {/* Scientific row 3: modes */}
            <div className="grid grid-cols-5 gap-1.5">
              <CalcButton label={isShift ? 'e' : 'π'} action={() => handleConstant(isShift ? 'e' : 'π')} variant="function" />
              <CalcButton label={angleMode} action={() => setAngleMode(m => m === 'DEG' ? 'RAD' : 'DEG')} variant="utility" />
              <CalcButton label="( )" action={handleParen} variant="utility" />
              <CalcButton label="SHIFT" action={() => setShift(s => s === 'normal' ? 'shift' : 'normal')} variant={isShift ? 'shift-active' : 'utility'} />
              <CalcButton label="1/x" action={() => appendToExpr('^(-1)')} variant="function" />
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-700/40 my-0.5" />

            {/* Main numpad */}
            <div className="grid grid-cols-4 gap-1.5">
              <CalcButton label="AC" action={handleClear} variant="clear" />
              <CalcButton label="+/−" action={handleSign} variant="utility" />
              <CalcButton label="%" action={handlePercent} variant="utility" />
              <CalcButton label="÷" action={() => handleOperator('÷')} variant="operator" />

              <CalcButton label="7" action={() => handleNumber('7')} variant="number" />
              <CalcButton label="8" action={() => handleNumber('8')} variant="number" />
              <CalcButton label="9" action={() => handleNumber('9')} variant="number" />
              <CalcButton label="×" action={() => handleOperator('×')} variant="operator" />

              <CalcButton label="4" action={() => handleNumber('4')} variant="number" />
              <CalcButton label="5" action={() => handleNumber('5')} variant="number" />
              <CalcButton label="6" action={() => handleNumber('6')} variant="number" />
              <CalcButton label="−" action={() => handleOperator('−')} variant="operator" />

              <CalcButton label="1" action={() => handleNumber('1')} variant="number" />
              <CalcButton label="2" action={() => handleNumber('2')} variant="number" />
              <CalcButton label="3" action={() => handleNumber('3')} variant="number" />
              <CalcButton label="+" action={() => handleOperator('+')} variant="operator" />

              <CalcButton label="0" action={() => handleNumber('0')} variant="number" wide />
              <CalcButton label="." action={() => handleNumber('.')} variant="number" />
              <CalcButton label="del" action={handleBackspace} variant="utility" isDelete />
              <CalcButton label="=" action={handleEquals} variant="equals" />
            </div>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="mt-3 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700/40 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/40">
              <span className="text-slate-300 text-sm font-medium">History</span>
              <div className="flex items-center gap-3">
                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {history.length === 0 ? (
                <div className="text-slate-600 text-sm text-center py-8">No calculations yet</div>
              ) : (
                history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDisplay(h.result);
                      setExpression('');
                      setLiveResult('');
                      setJustEvaluated(true);
                      setShowHistory(false);
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-slate-700/40 transition-colors border-b border-slate-700/20 last:border-0"
                  >
                    <div className="text-slate-500 text-xs truncate">{h.expression}</div>
                    <div className="text-slate-100 text-sm font-medium tabular-nums">{h.result}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface CalcButtonProps {
  label: string;
  action: () => void;
  variant: BtnVariant;
  wide?: boolean;
  isDelete?: boolean;
}

function CalcButton({ label, action, variant, wide = false, isDelete = false }: CalcButtonProps) {
  const base = `
    flex items-center justify-center rounded-xl font-medium
    transition-all duration-75 active:scale-[0.94] active:brightness-90
    select-none cursor-pointer focus:outline-none
    border border-transparent
  `;

  const sizeClass = wide ? 'col-span-2' : '';

  const styles: Record<BtnVariant, string> = {
    number:       'bg-slate-700 hover:bg-slate-600 text-white text-lg h-14 shadow shadow-black/30',
    operator:     'bg-amber-500 hover:bg-amber-400 text-white text-xl h-14 shadow shadow-amber-900/40',
    function:     'bg-slate-700/50 hover:bg-slate-600/60 text-cyan-300 text-xs h-10 border-slate-600/30',
    equals:       'bg-amber-500 hover:bg-amber-400 text-white text-xl h-14 shadow shadow-amber-900/40',
    clear:        'bg-red-500/15 hover:bg-red-500/25 text-red-400 text-base h-14 border-red-500/10',
    memory:       'bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 text-xs h-9 border-slate-600/20',
    utility:      'bg-slate-600/60 hover:bg-slate-500/60 text-slate-200 text-sm h-14',
    'shift-active': 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm h-14 border-amber-500/30',
  };

  return (
    <button
      className={`${base} ${sizeClass} ${styles[variant]}`}
      onClick={action}
      onMouseDown={e => e.preventDefault()}
    >
      {isDelete ? <Delete size={17} /> : label}
    </button>
  );
}
