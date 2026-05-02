import React, { useReducer, useCallback, useEffect, useState } from 'react';
import { create, all } from 'mathjs';
import { Smartphone, Monitor } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const math = create(all, { precision: 14, number: 'BigNumber' });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type CalcState = {
  display: string;
  expression: string;
  lastResult: string | null;
  hasError: boolean;
};

type CalcAction =
  | { type: 'APPEND'; payload: string }
  | { type: 'CLEAR' }
  | { type: 'DELETE' }
  | { type: 'EVALUATE' };

const initialState: CalcState = {
  display: '0',
  expression: '',
  lastResult: null,
  hasError: false,
};

function calculatorReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'APPEND': {
      if (state.hasError) return { ...initialState, expression: action.payload, display: action.payload };
      const newExpression = state.expression === '0' ? action.payload : state.expression + action.payload;
      return { ...state, expression: newExpression, display: newExpression };
    }
    case 'CLEAR':
      return initialState;
    case 'DELETE': {
      if (state.hasError) return initialState;
      const sliced = state.expression.slice(0, -1);
      return { ...state, expression: sliced || '', display: sliced || '0' };
    }
    case 'EVALUATE':
      try {
        if (!state.expression) return state;
        const result = math.evaluate(state.expression);
        const formattedResult = math.format(result, { precision: 10 }).toString();
        return {
          ...state,
          lastResult: state.expression,
          display: formattedResult,
          expression: formattedResult,
          hasError: false,
        };
      } catch (err) {
        return { ...state, display: 'Syntax Error', hasError: true };
      }
    default:
      return state;
  }
}

type BtnType = 'num' | 'op' | 'func' | 'util' | 'action';

interface ButtonDef {
  label: string;
  value: string;
  type: BtnType;
  keyMap?: string[];
}

const SCIENTIFIC_BUTTONS: ButtonDef[] = [
  { label: 'sin', value: 'sin(', type: 'func', keyMap: ['s'] },
  { label: 'cos', value: 'cos(', type: 'func', keyMap: ['c'] },
  { label: 'tan', value: 'tan(', type: 'func', keyMap: ['t'] },
  { label: 'log', value: 'log10(', type: 'func' },
  { label: 'ln', value: 'log(', type: 'func' },
  
  { label: 'sin⁻¹', value: 'asin(', type: 'func' },
  { label: 'cos⁻¹', value: 'acos(', type: 'func' },
  { label: 'tan⁻¹', value: 'atan(', type: 'func' },
  { label: 'π', value: 'pi', type: 'num', keyMap: ['p'] },
  { label: 'e', value: 'e', type: 'num', keyMap: ['e'] },

  { label: 'x²', value: '^2', type: 'func' },
  { label: 'x³', value: '^3', type: 'func' },
  { label: 'x^y', value: '^', type: 'op', keyMap: ['^'] },
  { label: '√', value: 'sqrt(', type: 'func' },
  { label: '∛', value: 'cbrt(', type: 'func' },

  { label: '(', value: '(', type: 'func', keyMap: ['('] },
  { label: ')', value: ')', type: 'func', keyMap: [')'] },
  { label: '1/x', value: '^-1', type: 'func' },
  { label: '!', value: '!', type: 'func', keyMap: ['!'] },
  { label: '%', value: '%', type: 'op', keyMap: ['%'] },
];

const NUMPAD_BUTTONS: ButtonDef[] = [
  { label: '7', value: '7', type: 'num', keyMap: ['7'] },
  { label: '8', value: '8', type: 'num', keyMap: ['8'] },
  { label: '9', value: '9', type: 'num', keyMap: ['9'] },
  { label: 'DEL', value: 'del', type: 'util', keyMap: ['Backspace'] },
  { label: 'AC', value: 'clear', type: 'util', keyMap: ['Escape'] },

  { label: '4', value: '4', type: 'num', keyMap: ['4'] },
  { label: '5', value: '5', type: 'num', keyMap: ['5'] },
  { label: '6', value: '6', type: 'num', keyMap: ['6'] },
  { label: '×', value: '*', type: 'op', keyMap: ['*', 'x'] },
  { label: '÷', value: '/', type: 'op', keyMap: ['/'] },

  { label: '1', value: '1', type: 'num', keyMap: ['1'] },
  { label: '2', value: '2', type: 'num', keyMap: ['2'] },
  { label: '3', value: '3', type: 'num', keyMap: ['3'] },
  { label: '+', value: '+', type: 'op', keyMap: ['+'] },
  { label: '-', value: '-', type: 'op', keyMap: ['-'] },

  { label: '0', value: '0', type: 'num', keyMap: ['0'] },
  { label: '.', value: '.', type: 'num', keyMap: ['.'] },
  { label: '+/-', value: '(-', type: 'util' },
  { label: 'EXP', value: 'E', type: 'num' },
  { label: '=', value: 'eval', type: 'action', keyMap: ['Enter', '='] },
];

export const ScientificCalculator: React.FC = () => {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const [isPortrait, setIsPortrait] = useState(false);

  const handlePress = useCallback((btn: ButtonDef) => {
    if (btn.value === 'clear') dispatch({ type: 'CLEAR' });
    else if (btn.value === 'del') dispatch({ type: 'DELETE' });
    else if (btn.value === 'eval') dispatch({ type: 'EVALUATE' });
    else dispatch({ type: 'APPEND', payload: btn.value });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const allBtns = [...SCIENTIFIC_BUTTONS, ...NUMPAD_BUTTONS];
      const match = allBtns.find(b => b.keyMap?.includes(e.key));
      if (match) {
        e.preventDefault();
        handlePress(match);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePress]);

  const renderButton = (btn: ButtonDef) => (
    <button
      key={btn.label}
      tabIndex={-1}
      onClick={() => handlePress(btn)}
      className={cn(
        "h-14 sm:h-16 rounded-xl text-sm sm:text-lg font-bold transition-all active:scale-95 flex items-center justify-center shadow-sm border-b-4 active:border-b-0 active:translate-y-1",
        btn.type === 'num' && "bg-slate-700 border-slate-900 text-slate-100 hover:bg-slate-600",
        btn.type === 'op' && "bg-blue-900 border-blue-950 text-blue-100 hover:bg-blue-800",
        btn.type === 'func' && "bg-slate-800 border-slate-950 text-emerald-400 hover:bg-slate-700 text-xs sm:text-sm",
        btn.type === 'util' && "bg-rose-900 border-rose-950 text-rose-100 hover:bg-rose-800",
        btn.type === 'action' && "bg-emerald-600 border-emerald-900 text-white hover:bg-emerald-500"
      )}
    >
      {btn.label}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-mono select-none">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 px-4">
        <h1 className="text-slate-400 font-bold tracking-widest text-lg">CASIO FX-SIMULATOR</h1>
        <button 
          onClick={() => setIsPortrait(!isPortrait)}
          className="flex items-center gap-2 bg-slate-800 text-slate-300 px-5 py-2.5 rounded-full hover:bg-slate-700 transition-colors font-semibold shadow-lg border border-slate-700 active:scale-95"
        >
          {isPortrait ? <Monitor size={18} /> : <Smartphone size={18} />}
          {isPortrait ? 'Wide Layout' : 'Tall Layout'}
        </button>
      </div>

      <div className={cn(
        "bg-slate-900 rounded-[2rem] shadow-2xl border-4 border-slate-800 overflow-hidden flex transition-all duration-500",
        isPortrait ? "flex-col max-w-md w-full" : "flex-col max-w-4xl w-full"
      )}>
        <div className="p-6 sm:p-8 flex flex-col items-end justify-end space-y-2 bg-slate-900/80 border-b-4 border-slate-950 min-h-[160px]">
          <div className="text-slate-400 text-sm sm:text-base h-6 w-full truncate text-right font-medium">
            {state.lastResult ? `${state.lastResult} =` : ''}
          </div>
          <div className={cn(
            "text-4xl sm:text-6xl font-bold transition-all truncate w-full text-right tracking-tight",
            state.hasError ? "text-rose-500" : "text-slate-100"
          )}>
            {state.display}
          </div>
        </div>

        <div className={cn(
          "flex p-4 sm:p-6 gap-4 sm:gap-6 bg-slate-800/40",
          isPortrait ? "flex-col" : "flex-row"
        )}>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 flex-1">
            {SCIENTIFIC_BUTTONS.map(renderButton)}
          </div>

          <div className={cn(
            "bg-slate-900/50 rounded-full",
            isPortrait ? "h-2 w-full my-1" : "w-2 h-full mx-1"
          )} />

          <div className="grid grid-cols-5 gap-2 sm:gap-3 flex-1">
            {NUMPAD_BUTTONS.map(renderButton)}
          </div>
        </div>
      </div>
    </div>
  );
};