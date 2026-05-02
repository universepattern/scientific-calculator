# Scientific Calculator

![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)  
**[View the Live Calculator on GitHub Pages](https://universepattern.github.io/scientific-calculator)**

A production-ready, dark-themed scientific calculator built with React, TypeScript, and MathJS. 

## What It Does
This is a responsive, web-based calculator that supports standard arithmetic operations as well as scientific functions like trigonometric calculations (Sine, Cosine, Tangent), square roots, and exponentiation. It's designed to be reliable, fast, and visually appealing, featuring a modern, dark UI inspired by premium hardware.

## Features
- **High Precision Math:** Prevents standard JavaScript floating-point errors (e.g., `0.1 + 0.2` yielding `0.30000000000000004`).
- **Full Scientific Operations:** Includes trigonometric functions, logarithms, roots, and exponents.
- **Calculation History:** Automatically saves your last 50 calculations. Click any past equation to instantly reload the result.
- **Copy to Clipboard:** One-click button to instantly copy the current display or result.
- **Full Keyboard Support:** Type seamlessly using your physical keyboard (supports numbers, operations, Enter, Backspace, Escape, and letters for trig functions).
- **Responsive Layout Toggle:** Defaults to a wide landscape layout, but features a dedicated "Tall Layout" button to optimize the view for portrait mobile screens.
- **Modern UI/UX:** Built with Tailwind CSS v4, featuring a stunning "deep space blue" aesthetic with frosted glass elements (`backdrop-blur`) and vibrant blue action buttons.
- **Animated Math Background:** Features a subtle, dynamically generated background canvas with glowing, floating mathematical equations (calculus and trigonometry) that drift in slow-motion without distracting from the main calculator.

## The Math Behind It
Standard JavaScript uses the `eval()` function or primitive number operators, which are notorious for floating-point inaccuracies and security vulnerabilities. 

This calculator engine circumvents these issues by utilizing **[MathJS](https://mathjs.org/)** with the `BigNumber` protocol enabled. 
- **BigNumber Precision:** Numbers are parsed into `BigNumber` instances which are evaluated up to 14 decimal places of precision, guaranteeing exact calculations.
- **No-Eval Execution:** Mathematical strings are evaluated through an AST (Abstract Syntax Tree) parser provided by MathJS (`math.evaluate`), eliminating the security risks associated with native JavaScript evaluation.
- **Trigonometry:** Trigonometric operations are accurately computed over the configured precision threshold before being formatted down for clean display outputs.
