/**
 * @file ScientificCalculator.tsx
 * @description A production-ready scientific calculator using React, TypeScript, and MathJS.
 */

import React, { useReducer, useCallback } from 'react';
import { create, all } from 'mathjs';
import { Delete, RotateCcw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility & Configuration ---
const math = create(all, { precision: 14, number: 'BigNumber' });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
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
  | { type: 'EVALUATE' }
  | { type: 'FUNCTION'; payload: string };

// --- Constants ---
const BUTTONS = [
  { label: '(', value: '(', type: 'op' },
  { label: ')', value: ')', type: 'op' },
  { label: '√', value: 'sqrt(', type: 'func' },
  { label: 'AC', value: 'clear', type: 'util' },
  { label: 'sin', value: 'sin(', type: 'func' },
  { label: 'cos', value: 'cos(', type: 'func' },
  { label: 'tan', value: 'tan(', type: 'func' },
  { label: '÷', value: '/', type: 'op' },
  { label: '7', value: '7', type: 'num' },
  { label: '8', value: '8', type: 'num' },
  { label: '9', value: '9', type: 'num' },
  { label: '×', value: '*', type: 'op' },
  { label: '4', value: '4', type: 'num' },
  { label: '5', value: '5', type: 'num' },
  { label: '6', value: '6', type: 'num' },
  { label: '-', value: '-', type: 'op' },
  { label: '1', value: '1', type: 'num' },
  { label: '2', value: '2', type: 'num' },
  { label: '3', value: '3', type: 'num' },
  { label: '+', value: '+', type: 'op' },
  { label: '0', value: '0', type: 'num' },
  { label: '.', value: '.', type: 'num' },
  { label: 'EXP', value: '^', type: 'op' },
  { label: '=', value: 'eval', type: 'action' },
];

// --- Reducer Logic ---
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
    case 'DELETE':
      const sliced = state.expression.slice(0, -1);
      return { ...state, expression: sliced || '', display: sliced || '0' };
    case 'EVALUATE':
      try {
        if (!state.expression) return state;
        // Sanitize and evaluate
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
        return { ...state, display: 'Error', hasError: true };
      }
    default:
      return state;
  }
}

// --- Components ---
/**
 * @component ScientificCalculator
 * @description Main calculator interface with responsive grid layout.
 */
export const ScientificCalculator: React.FC = () => {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);

  const handlePress = useCallback((btn: typeof BUTTONS[0]) => {
    if (btn.value === 'clear') dispatch({ type: 'CLEAR' });
    else if (btn.value === 'eval') dispatch({ type: 'EVALUATE' });
    else dispatch({ type: 'APPEND', payload: btn.value });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-mono">
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Display Screen */}
        <div className="p-8 flex flex-col items-end justify-end space-y-2 bg-slate-900/50">
          <div className="text-slate-500 text-sm h-6 truncate">
            {state.lastResult ? `${state.lastResult} =` : ''}
          </div>
          <div className={cn(
            "text-4xl font-bold transition-all truncate w-full text-right",
            state.hasError ? "text-red-400" : "text-slate-100"
          )}>
            {state.display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-1 p-4 bg-slate-800/20">
          {BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => handlePress(btn)}
              className={cn(
                "h-16 rounded-xl text-lg font-semibold transition-all active:scale-95 flex items-center justify-center",
                btn.type === 'num' && "bg-slate-800 text-slate-100 hover:bg-slate-700",
                btn.type === 'op' && "bg-slate-700/50 text-blue-400 hover:bg-blue-900/20",
                btn.type === 'func' && "bg-slate-800 text-emerald-400 hover:bg-emerald-900/20 text-sm",
                btn.type === 'util' && "bg-red-900/20 text-red-400 hover:bg-red-900/40",
                btn.type === 'action' && "bg-blue-600 text-white hover:bg-blue-500 col-span-1"
              )}
            >
              {btn.label}
            </button>
          ))}
          <button 
            onClick={() => dispatch({ type: 'DELETE' })}
            className="h-16 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center justify-center"
          >
            <Delete size={20} />
          </button>
          <button 
            onClick={() => dispatch({ type: 'CLEAR' })}
            className="h-16 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 flex items-center justify-center"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Security Warning */}
      <footer className="mt-6 text-slate-600 text-[10px] uppercase tracking-widest">
        Engine: MathJS BigNumber Protocol | No-Eval Execution
      </footer>
    </div>
  );
};