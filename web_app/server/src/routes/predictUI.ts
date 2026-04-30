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
    * Render the prediction UI once at module load by inlining public HTML, CSS,
    * and browser script files.
    * @returns {string} - HTML page containing the prediction UI.
    * @throws {Error} - Throws if any required public UI file cannot be read.
*/
function renderPredictionUI(): string {
    const publicDir = path.join(process.cwd(), 'public');
    const html = fs.readFileSync(path.join(publicDir, 'public.html'), 'utf8');
    const css = fs.readFileSync(path.join(publicDir, 'public.css'), 'utf8');
    const script = fs.readFileSync(path.join(publicDir, 'public.ts'), 'utf8');

    return html
        .replace('{{PUBLIC_CSS}}', css)
        .replace('{{PUBLIC_SCRIPT}}', script);
}

const predictionUIHTML = renderPredictionUI();

/*
    * Serve cached prediction UI HTML without filesystem I/O in the request path.
    * @param {Request} req - Express request object.
    * @param {Response} res - Express response object used to send the rendered HTML page.
    * @returns {Response} - HTML response containing the prediction UI.
*/
export function predictionUI(req: Request, res: Response) {
    return res.status(200).send(predictionUIHTML);
}
