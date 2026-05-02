import React, { useReducer, useCallback, useEffect, useState, useRef } from 'react';
import { create, all } from 'mathjs';
import { Smartphone, Monitor, Copy, Check, History } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const math = create(all, { precision: 14, number: 'BigNumber' });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type HistoryItem = {
  expression: string;
  result: string;
};

type CalcState = {
  display: string;
  expression: string;
  lastResult: string | null;
  history: HistoryItem[];
  hasError: boolean;
};

type CalcAction =
  | { type: 'APPEND'; payload: string }
  | { type: 'SET_EXPRESSION'; payload: string }
  | { type: 'CLEAR' }
  | { type: 'DELETE' }
  | { type: 'EVALUATE' }
  | { type: 'CLEAR_HISTORY' };

const initialState: CalcState = {
  display: '0',
  expression: '',
  lastResult: null,
  history: [],
  hasError: false,
};

function calculatorReducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case 'APPEND': {
      if (state.hasError) return { ...initialState, history: state.history, expression: action.payload, display: action.payload };
      const newExpression = state.expression === '0' ? action.payload : state.expression + action.payload;
      return { ...state, expression: newExpression, display: newExpression };
    }
    case 'SET_EXPRESSION':
      return { ...state, expression: action.payload, display: action.payload, hasError: false };
    case 'CLEAR':
      return { ...initialState, history: state.history };
    case 'CLEAR_HISTORY':
      return { ...state, history: [] };
    case 'DELETE': {
      if (state.hasError) return { ...initialState, history: state.history };
      const sliced = state.expression.slice(0, -1);
      return { ...state, expression: sliced || '', display: sliced || '0' };
    }
    case 'EVALUATE':
      try {
        if (!state.expression) return state;
        const result = math.evaluate(state.expression);
        const formattedResult = math.format(result, { precision: 10 }).toString();
        
        const isDuplicate = state.history.length > 0 && 
            state.history[state.history.length - 1].expression === state.expression;

        const newHistory = isDuplicate ? state.history : [...state.history, { expression: state.expression, result: formattedResult }];
        if (newHistory.length > 50) newHistory.shift();

        return {
          ...state,
          lastResult: state.expression,
          display: formattedResult,
          expression: formattedResult,
          history: newHistory,
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
  { label: 'AC', value: 'clear', type: 'action', keyMap: ['Escape'] },

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

const MathBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const equations = [
      '∫ f(x)dx = F(x) + C', 'sin²θ + cos²θ = 1', 'e^(iπ) + 1 = 0',
      'd/dx [uv] = u dv/dx + v du/dx', 'lim_{x→0} sin(x)/x = 1',
      'F(s) = ∫ f(t)e^{-st} dt', '∇×E = -∂B/∂t', '∮ B·dl = μ₀I',
      'x = (-b ± √(b² - 4ac)) / 2a', 'A = πr²', 'V = 4/3 πr³',
      '∑_{n=1}^∞ (1/n²) = π²/6', 'd/dx (x^n) = nx^{n-1}', '∇²ϕ = 0',
      'λ = h/p', 'E = mc²', 'i² = -1'
    ];

    const drops: { x: number, y: number, speed: number, text: string, opacity: number, scale: number, phase: number }[] = [];
    
    // Spread them randomly across the screen instead of columns
    for (let i = 0; i < 40; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.05 + Math.random() * 0.1, // extremely slow drift
        text: equations[Math.floor(Math.random() * equations.length)],
        opacity: 0.1 + Math.random() * 0.4,
        scale: 0.8 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2
      });
    }

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);
      
      drops.forEach(drop => {
        // Glowing light blue / slate text
        ctx.fillStyle = `rgba(226, 232, 240, ${drop.opacity * 0.7})`; 
        ctx.font = `${16 * drop.scale}px sans-serif`;
        
        // Gentle sway and slow rise
        const swayX = drop.x + Math.sin(time + drop.phase) * 10;
        ctx.fillText(drop.text, swayX, drop.y);
        
        drop.y -= drop.speed;
        
        if (drop.y < -50) {
          drop.y = height + 50;
          drop.x = Math.random() * width;
          drop.text = equations[Math.floor(Math.random() * equations.length)];
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none blur-[1px] opacity-80 z-0" 
    />
  );
};

export const ScientificCalculator: React.FC = () => {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePress = useCallback((btn: ButtonDef) => {
    if (showHistory) setShowHistory(false);
    if (btn.value === 'clear') dispatch({ type: 'CLEAR' });
    else if (btn.value === 'del') dispatch({ type: 'DELETE' });
    else if (btn.value === 'eval') dispatch({ type: 'EVALUATE' });
    else dispatch({ type: 'APPEND', payload: btn.value });
  }, [showHistory]);

  const handleCopy = () => {
    navigator.clipboard.writeText(state.display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        "h-12 sm:h-14 rounded-[0.8rem] text-sm sm:text-[15px] font-medium transition-all active:scale-[0.97] flex items-center justify-center border shadow-sm relative z-10",
        btn.type === 'num' && "bg-slate-800/90 border-slate-700/50 text-slate-100 hover:bg-slate-700",
        btn.type === 'op' && "bg-slate-700/60 border-slate-600/50 text-slate-200 hover:bg-slate-600",
        btn.type === 'func' && "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700",
        btn.type === 'util' && "bg-slate-700/60 border-slate-600/50 text-slate-200 hover:bg-slate-600",
        btn.type === 'action' && "bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-md shadow-blue-900/20"
      )}
    >
      {btn.label}
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 font-sans select-none relative overflow-hidden">
      {/* Deep dark slate background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D1522] via-slate-900 to-black pointer-events-none z-0" />
      
      <MathBackground />
      
      <div className="w-full max-w-4xl flex justify-end items-center mb-6 px-4 relative z-10">
        <button 
          onClick={() => setIsPortrait(!isPortrait)}
          className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md text-slate-300 px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-colors font-medium shadow-lg border border-slate-700 active:scale-95"
        >
          {isPortrait ? <Monitor size={16} /> : <Smartphone size={16} />}
          {isPortrait ? 'Wide Layout' : 'Tall Layout'}
        </button>
      </div>

      <div className={cn(
        "bg-slate-800/90 backdrop-blur-3xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-slate-700 overflow-hidden flex transition-all duration-500 relative z-10",
        isPortrait ? "flex-col max-w-md w-full" : "flex-col max-w-4xl w-full"
      )}>
        {/* Screen */}
        <div className="relative p-6 sm:p-8 flex flex-col items-end justify-end space-y-2 bg-slate-900/80 border border-slate-800 rounded-2xl mx-4 sm:mx-6 mt-4 sm:mt-6 shadow-inner min-h-[140px]">
          
          <div className="absolute top-4 left-4 flex gap-4">
            <button 
              onClick={handleCopy} 
              className="text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-semibold group"
              title="Copy to Clipboard"
            >
              {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} className="group-hover:scale-110 transition-transform" />}
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className={cn(
                "hover:text-blue-400 transition-colors flex items-center gap-2 text-sm font-semibold group",
                showHistory ? "text-blue-400" : "text-slate-500"
              )}
              title="Calculation History"
            >
              <History size={20} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <div className="text-slate-400 text-sm sm:text-base h-6 w-full truncate text-right font-medium pr-1">
            {state.lastResult && !showHistory ? `${state.lastResult} =` : ''}
          </div>
          <div className={cn(
            "text-4xl sm:text-6xl font-light transition-all truncate w-full text-right tracking-tight drop-shadow-sm",
            state.hasError ? "text-rose-500" : "text-slate-100"
          )}>
            {state.display}
          </div>
        </div>

        {/* Dynamic Body */}
        <div className={cn(
          "relative",
          showHistory ? "flex flex-col p-4 sm:p-6" : cn("flex p-4 sm:p-6 gap-3 sm:gap-4", isPortrait ? "flex-col" : "flex-row")
        )}>
          {showHistory ? (
            <div className="w-full h-[350px] sm:h-[450px] overflow-y-auto flex flex-col gap-3 pr-2">
              <div className="flex justify-between items-center mb-2 px-2 sticky top-0 bg-slate-800/90 backdrop-blur-md py-2 z-20 rounded-lg">
                <h2 className="text-slate-400 font-bold tracking-widest text-sm">HISTORY</h2>
                {state.history.length > 0 && (
                  <button 
                    onClick={() => dispatch({ type: 'CLEAR_HISTORY' })}
                    className="text-rose-400 hover:text-rose-300 text-xs font-bold tracking-wider bg-slate-900/50 px-4 py-1.5 rounded-xl hover:bg-slate-700 transition-colors border border-slate-700/50"
                  >
                    CLEAR
                  </button>
                )}
              </div>
              {state.history.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-medium pb-10">
                  No history recorded yet.
                </div>
              ) : (
                [...state.history].reverse().map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col text-right cursor-pointer bg-slate-700/30 hover:bg-slate-700/60 p-4 rounded-xl transition-colors border border-slate-700/50 shadow-sm group"
                    onClick={() => {
                      dispatch({ type: 'SET_EXPRESSION', payload: item.result });
                      setShowHistory(false);
                    }}
                  >
                    <div className="text-slate-500 text-sm mb-1 group-hover:text-slate-400 transition-colors font-medium">{item.expression} =</div>
                    <div className="text-slate-200 font-medium text-2xl group-hover:text-blue-400 transition-colors">{item.result}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-2 sm:gap-2.5 flex-1 relative z-10">
                {SCIENTIFIC_BUTTONS.map(renderButton)}
              </div>
              <div className={cn(
                "bg-slate-700/50 rounded-full",
                isPortrait ? "h-px w-full my-2" : "w-px h-full mx-2"
              )} />
              <div className="grid grid-cols-5 gap-2 sm:gap-2.5 flex-1 relative z-10">
                {NUMPAD_BUTTONS.map(renderButton)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};