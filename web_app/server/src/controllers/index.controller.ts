/*
    * This file contains the controller for the index route of the application.
    * It contains the basic landing page for the / route.
*/
import { Request, Response } from 'express';

async function indexController(req: Request, res: Response) {
    const html = `
        <html>
          <head>
            <title>News Bias Inference API</title>
            <style>
              body { 
                  font-family: Arial; 
                  max-width: 700px; 
                  margin: 40px auto; 
              }
              code { 
                  background: #f4f4f4; 
                  padding: 4px 6px; 
              }
              pre {
                    background: #f4f4f4;
                    padding: 12px;
                    overflow-x: auto;
                    white-space: pre-wrap; // Enable wrapping of long lines
                    word-wrap: break-word; // Break long words if necessary
              }
            </style>
          </head>

          <body>
            <h1>News Bias Inference API</h1>
            <p>Production ML inference backend deployed on AWS.</p>

            <h2>Endpoints</h2>
            <ul>
              <li><code>GET /health</code></li>
              <li><code>POST /predict</code></li>
            </ul>

            <h2>Example Requests</h2>
            <p>Use the following curl commands to test the API in the CLI:</p>
            <pre>curl -X GET https://api.osvaldohernandez.dev/health</pre>
            <pre>
curl -X POST https://api.osvaldohernandez.dev/predict \\
-H "Content-Type: application/json" \\
-d "{\\"text\\":\\"President Donald Trump's plane, Air Force One, returned to Joint Base Andrews about an hour after departing for Switzerland on Tuesday evening. White House press secretary Karoline Leavitt said the decision to return was made after takeoff when the crew aboard Air Force One identified a minor electrical issue and, out of an abundance of caution, decided to turn around.\\\\n\\\\nA reporter on board said the lights in the press cabin of the aircraft went out briefly after takeoff, but no explanation was immediately offered.\\"}"
</pre>

            <p>Built with Python, TypeScript, Docker, AWS App Runner.</p>

            <h2> Article Example</h2>
            <h3>Air Force One returns to Washington area due to minor electrical issue, White House says</h3>
            <p>President Donald Trump's plane, Air Force One, returned to Joint Base Andrews about an hour after departing for Switzerland on Tuesday evening. White House press secretary Karoline Leavitt said the decision to return was made after takeoff when the crew aboard Air Force One identified a minor electrical issue and, out of an abundance of caution, decided to turn around.<br><br>A reporter on board said the lights in the press cabin of the aircraft went out briefly after takeoff, but no explanation was immediately offered. About half an hour into the flight, reporters were told the plane would be turning around. Trump will board another aircraft and continue on with his trip to the World Economic Forum in Davos.<br><br>The two planes currently used as Air Force One have been flying for nearly four decades. Boeing has been working on replacements, but the program has faced a series of delays. The planes are heavily modified with survivability capabilities for the president for a range of contingencies, including radiation shielding and antimissile technology. They also include a variety of communications systems to allow the president to remain in contact with the military and issue orders from anywhere in the world.<br><br>Last year, the ruling family of Qatar gifted Trump a luxury Boeing 747-8 jumbo jet to be added into the Air Force One fleet, a move that faced great scrutiny. That plane is currently being retrofitted to meet security requirements. Leavitt joked to reporters on Air Force One Tuesday night that a Qatari jet was sounding much better right now.<br><br>Last February, an Air Force plane carrying Secretary of State Marco Rubio to Germany had to return to Washington because of a mechanical issue. In October, a military plane carrying Defense Secretary Pete Hegseth had to make an emergency landing in the United Kingdom due to a crack in the windshield.</p>

            <h3>Sources</h3>
            <ul>
              <li><a href="https://apnews.com/article/trump-air-force-one-electrical-issue-c3044b52b792a8c12f6211718d94f8fe">Air Force One returns to Washington area due to minor electrical issue, White House says. Associated Press News (2026).</a></li>
              <li><p>Hyperpartisan Training Dataset. Zenodo (2018).</p><a href="https://doi.org/10.5281/zenodo.1489920"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.1489920.svg" alt="DOI"></a></li>
              <li><p>Source code available on <a href="https://github.com/A1-D0">GitHub</a>.</p></li>
            </ul>

          </body>

    </html>
    `;

    res.status(200).send(html);
}

export default indexController;
