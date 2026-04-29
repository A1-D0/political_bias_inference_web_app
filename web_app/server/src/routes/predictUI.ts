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

/*
    * Serve the prediction UI by inlining public HTML, CSS, and browser script files.
    * @param {Request} _req - Express request object. Unused because this route has no request inputs.
    * @param {Response} res - Express response object used to send the rendered HTML page.
    * @returns {Response} - HTML response containing the prediction UI.
    * @throws {Error} - Throws if any required public UI file cannot be read.
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
