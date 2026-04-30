/*
    * This file contains the controller for the index route of the application.
    * It contains the basic landing page for the / route.
*/
import { Request, Response } from 'express';

async function indexController(req: Request, res: Response) {
    const html = `
        <html>
          <head>
            <title>Political Bias Inference API</title>
            <style>
              body { 
                  background: #f0f0f0;
                  font-family: Arial; 
                  max-width: 900px; 
                  margin: 40px auto; 
              }
              pre {
                    background: #f0ffff;
                    padding: 12px;
                    overflow-x: auto;
                    white-space: pre-wrap; // Enable wrapping of long lines
                    word-wrap: break-word; // Break long words if necessary
              }
              .toggle-list {
                    list-style: none;
                    padding-left: 0;
              }
              .toggle-list li {
                    margin: 12px 0;
              }
              details {
                    background: #ffffff;
                    border: 1px solid #d0d0d0;
                    padding: 12px;
              }
              summary {
                    cursor: pointer;
                    font-weight: bold;
              }
              details[open] summary {
                    margin-bottom: 12px;
              }
            </style>
          </head>

          <body>
            <h1>Political Bias Inference API</h1>
            <p>Built with Python, TypeScript, Docker, AWS App Runner.</p>

            <p><b>Note: This web API is only available during weekdays from 9 AM to 4 PM (Eastern Time).</b></p>

            <h2>API Overview</h2>
            <p>REST API for political bias inference on U.S. news articles.</p>
            <p>Production ML inference backend deployed on AWS.</p>
            <p>Express gateway &rarr; Flask ML service &rarr; S3 model artifacts.</p>

            <p></p>

            <h2>Endpoints</h2>
            <ul class="toggle-list">
              <li>
                <details>
                  <summary>GET /</summary>
                  <p>Landing page with API overview and usage instructions (i.e., this page).</p>
                  <p><b>Response:</b></p>
                  <p>Response status: 304</p>
                  <p>Gets the cached version of the page from the browser if available and unmodified on the server.</p>
                  <p>Response status: 200</p>
                  <p>Returns the updated landing page.</p>
                </details>
              </li>
              <li>
                <details>
                  <summary>GET /health</summary>
                  <p>Health check endpoint. Returns JSON with service status and uptime.</p>
                  <p><b>Response:</b></p>
                  <p>Response status: 200</p>
                  <pre>
{
    "status": "ok",
    "service": "server",
    "timestamp": "2026-03-01T04:33:40.199Z",
    "uptime_seconds": 28400
}
</pre>
                </details>
              </li>
              <li>
                <details>
                  <summary>GET /predict</summary>
                  <p>Loads a page for UI-based text inputs.</p>
                  <p><b>Response:</b></p>
                  <p>Response status: 304</p>
                  <p>Gets the cached version of the page from the browser if available and unmodified on the server.</p>
                  <p>Response status: 200</p>
                  <p>Returns the updated prediction UI page.</p>
                </details>
              </li>
              <li>
                <details>
                  <summary>POST /api/predict</summary>
                  <p>Accepts JSON with a news article text and returns bias inference results.</p>
                  <p><b>Required headers:</b></p>
                  <pre>
Content-Type: application/json
X-Internal-API-Key: &lt;api_key&gt;
</pre>
                  <p><b>Request body:</b></p>
                  <pre>
{
    "text": "Full text of a news article (max 3000 chars)"
}
</pre>
                  <p><b>Contraints:</b></p>
                  <ul>
                    <li>Input text should ideally be a news article or a portion of one (max 3000 chars).</li>
                    <li>API is designed to handle English news articles of U.S. contexts.</li>
                  </ul>
                  <p><b>Response:</b></p>
                  <p>Response status: 200</p>
                  <pre>
{
    "prediction": "center",
    "model_version": "linear_svc_pipeline_v1",
    "label_encoder_version": "articles-bypublisher_LabelEncoder_v1"
}
</pre>
                  <p>Response status: 400</p>
                  <pre>
{
    "error": "Invalid request data"
}
</pre>
                  <p>Response status: 401</p>
                  <pre>
{
    "error": "Unauthorized access. Invalid API key."
}
</pre>
                  <p>Response status: 429</p>
                  <pre>
{
    "error": "Too many requests, please try again later."
}
</pre>
                  <p>Response status: 502</p>
                  <pre>
{
    "error": "Bad Gateway Error"
}
</pre>
                </details>
              </li>
            </ul>

            <h2>How to Use The API</h2>
            <p>Use the following curl commands to test the API in the CLI:</p>
            <ul class="toggle-list">
              <li>
                <details>
                  <summary>GET /</summary>
                  <pre>curl -X GET https://api.osvaldohernandez.dev/</pre>
                </details>
              </li>
              <li>
                <details>
                  <summary>GET /health</summary>
                  <pre>curl -X GET https://api.osvaldohernandez.dev/health</pre>
                </details>
              </li>
              <li>
                <details>
                  <summary>GET /predict</summary>
                  <pre>curl -X GET https://api.osvaldohernandez.dev/predict</pre>
                </details>
              </li>
              <li>
                <details>
                  <summary>POST /api/predict</summary>
                  <pre>
TEXT="President Donald Trump's plane, Air Force One, returned to Joint Base Andrews about an hour after departing for Switzerland on Tuesday evening. White House press secretary Karoline Leavitt said the decision to return was made after takeoff when the crew aboard Air Force One identified a minor electrical issue and, out of an abundance of caution, decided to turn around.\\\\n\\\\nA reporter on board said the lights in the press cabin of the aircraft went out briefly after takeoff, but no explanation was immediately offered."

curl -X POST https://api.osvaldohernandez.dev/api/predict \\
-H "Content-Type: application/json" \\
-d "$(jq -n --arg text "$TEXT" '{text: $text}')"
</pre>
                </details>
              </li>
            </ul>

            <p>Note that the API is designed to handle news articles of U.S. contexts. Additionally, the text input should ideally be a news article or a portion of one (max 3000 chars) for best results.</p>

            <h2> Article Example</h2>
            <h3>Air Force One returns to Washington area due to minor electrical issue, White House says</h3>
            <p>President Donald Trump's plane, Air Force One, returned to Joint Base Andrews about an hour after departing for Switzerland on Tuesday evening. White House press secretary Karoline Leavitt said the decision to return was made after takeoff when the crew aboard Air Force One identified a minor electrical issue and, out of an abundance of caution, decided to turn around.<br><br>A reporter on board said the lights in the press cabin of the aircraft went out briefly after takeoff, but no explanation was immediately offered. About half an hour into the flight, reporters were told the plane would be turning around. Trump will board another aircraft and continue on with his trip to the World Economic Forum in Davos.<br><br>The two planes currently used as Air Force One have been flying for nearly four decades. Boeing has been working on replacements, but the program has faced a series of delays. The planes are heavily modified with survivability capabilities for the president for a range of contingencies, including radiation shielding and antimissile technology. They also include a variety of communications systems to allow the president to remain in contact with the military and issue orders from anywhere in the world.<br><br>Last year, the ruling family of Qatar gifted Trump a luxury Boeing 747-8 jumbo jet to be added into the Air Force One fleet, a move that faced great scrutiny. That plane is currently being retrofitted to meet security requirements. Leavitt joked to reporters on Air Force One Tuesday night that a Qatari jet was sounding much better right now.<br><br>Last February, an Air Force plane carrying Secretary of State Marco Rubio to Germany had to return to Washington because of a mechanical issue. In October, a military plane carrying Defense Secretary Pete Hegseth had to make an emergency landing in the United Kingdom due to a crack in the windshield.</p>

            <h3>Sources</h3>
            <ul>
              <li><a href="https://apnews.com/article/trump-air-force-one-electrical-issue-c3044b52b792a8c12f6211718d94f8fe">Air Force One returns to Washington area due to minor electrical issue, White House says. Associated Press News (2026).</a></li>
              <li><p>Hyperpartisan Training Dataset. Zenodo (2018).</p><a href="https://doi.org/10.5281/zenodo.1489920"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.1489920.svg" alt="DOI"></a></li>
              <li><p>Source code available on <a href="https://github.com/A1-D0/political_bias_inference_web_app">GitHub</a>.</p></li>
            </ul>

          </body>

    </html>
    `;

    res.status(200).send(html);
}

export default indexController;
