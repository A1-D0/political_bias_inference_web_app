/*
    * Description:
    * This file serves the prediction UI by loading the public HTML, CSS,
    * and browser script files, then inlining them into the GET /predict response.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 28, 2026
    * Date Modified: April 28, 2026
    * References: Copilot, ChatGPT, Express documentation
*/
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Serves the prediction UI from the public files without adding separate
 * CSS or JavaScript asset endpoints.
 */
export function predictionUI(_req: Request, res: Response) {
    const publicDir = path.join(process.cwd(), 'public');
    const html = fs.readFileSync(path.join(publicDir, 'public.html'), 'utf8');
    const css = fs.readFileSync(path.join(publicDir, 'public.css'), 'utf8');
    const script = fs.readFileSync(path.join(publicDir, 'public.ts'), 'utf8');

    return res.status(200).send(
        html
        .replace('{{PUBLIC_CSS}}', css)
        .replace('{{PUBLIC_SCRIPT}}', script)
    );
}
