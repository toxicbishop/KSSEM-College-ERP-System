/*
 * Minimal Genkit shim to replace @genkit-ai packages while avoiding OpenTelemetry dependencies.
 * This shim provides a very lightweight implementation of the `genkit` function and a
 * `genkitNextHandler` compatible with the existing Next.js API route.
 *
 * It is **not** a full replacement for Genkit – it only supplies the parts used by
 * this repository (the `genkit` factory and the Next.js handler). All telemetry and
 * heavy‑weight instrumentation are intentionally omitted.
 */

import { NextResponse } from 'next/server';

type GenkitOptions = {
  promptDir?: string;
  plugins?: any[];
  [key: string]: any;
};

/**
 * Minimal stub for the `genkit` factory. It simply returns the options object
 * so that other code can access `plugins` or other configuration if needed.
 */
// Minimal Genkit shim implementation
export function genkit(options: GenkitOptions = {}): any {
  const base = { ...options } as any;
  // Stub for definePrompt – returns a prompt object with a placeholder run method
  base.definePrompt = (cfg: any) => ({
    ...cfg,
    async run(_input: any) {
      void _input;
      console.warn('[genkit shim] Prompt run invoked but not implemented.');
      return {};
    },
  });
  // Stub for defineFlow – returns a callable flow that executes the provided implementation
  base.defineFlow = (cfg: any, impl: any) => {
    const flowFunc = async (input: any) => {
      try {
        return await impl(input);
      } catch (e) {
        console.error('[genkit shim] Flow execution error:', e);
        throw e;
      }
    };
    // Attach config for potential introspection (optional)
    (flowFunc as any).config = cfg;
    return flowFunc;
  };
  return base;
}

/**
 * Minimal Next.js handler shim. It returns an object with `GET` and `POST`
 * methods that respond with a simple JSON payload. This satisfies the shape
 * expected by `src/app/api/genkit/[...slug]/route.ts` without pulling in the
 * heavyweight `@genkit-ai/next` package.
 */
export function genkitNextHandler() {
  return {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    async GET(_request: Request, _context: any) {
      return NextResponse.json({ message: 'Genkit shim GET response' });
    },
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    async POST(request: Request, _context: any) {
      try {
        const body = await request.json();
        return NextResponse.json({ message: 'Genkit shim POST response', body });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
    },
  };
}
