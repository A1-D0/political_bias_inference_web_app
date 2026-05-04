/*
    * Description:
    * This browser script handles the prediction UI form, character counter,
    * API request to /api/predict, loading state, prediction rendering, and
    * user-facing error messages.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 28, 2026
    * Date Modified: April 28, 2026
    * References: Copilot, ChatGPT, Express documentation
*/
// This file is inlined into public.html and executed directly by the browser.
// Keep it as vanilla JavaScript even though the file extension is .ts.
(function () {
    // Single UI-side source of truth for textarea length and counter display.
    const MAX_TEXT_LENGTH = 3000;

    /*
        * Initialize the prediction form behavior after required DOM elements are available.
        * @returns {void}
    */
    function initPredictionForm() {
        const form = document.getElementById('prediction-form');
        const textInput = document.getElementById('article-text');
        const characterCount = document.getElementById('article-character-count');
        const button = document.getElementById('predict-button');
        const output = document.getElementById('prediction-output');

        if (!form || !textInput || !characterCount || !button || !output) return;

        textInput.maxLength = MAX_TEXT_LENGTH;

        /*
            * Update the visible character counter using the raw textarea value length.
            * @returns {void}
        */
        function updateCharacterCount() {
            characterCount.textContent = textInput.value.length + '/' + MAX_TEXT_LENGTH + ' characters';
        }

        /*
            * Render a status or error message in the prediction output area.
            * @param {string} message - Message to display to the user.
            * @param {string} state - Optional CSS state class, such as "loading" or "error".
            * @returns {void}
        */
        function setOutput(message, state) {
            output.className = 'prediction-output';
            output.innerHTML = '';
            if (state) output.classList.add(state);
            output.textContent = message;
        }

        /*
            * Render a successful prediction response in the output area.
            * @param {object} data - Prediction response from /api/predict.
            * @returns {void}
        */
        function setResult(data) {
            output.className = 'prediction-output success';
            output.textContent = '';
            output.innerHTML = [
                '<dl>',
                '<dt>Prediction</dt>',
                '<dd>' + escapeHtml(data.prediction) + '</dd>',
                '<dt>Model version</dt>',
                '<dd>' + escapeHtml(data.model_version) + '</dd>',
                '<dt>Label encoder version</dt>',
                '<dd>' + escapeHtml(data.label_encoder_version) + '</dd>',
                '</dl>',
            ].join('');
        }

        /*
            * Escape text before inserting API-provided values into HTML markup.
            * @param {*} value - Value to convert to escaped HTML text.
            * @returns {string} - HTML-safe string.
        */
        function escapeHtml(value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        /*
            * Parse a response body as JSON when possible.
            * @param {Response} response - Fetch API Response object.
            * @returns {object|null} - Parsed JSON object promise, or null if parsing failed.
        */
        function parseJSONBody(response) {
            if (!response) return null;

            try {
                return response.json();
            } catch (_error) {
                return null;
            }
        }

        /*
            * Extract an error value from plain text responses such as
            * "error code: 502" or "error: upstream unavailable".
            * @param {string} bodyText - Raw response body text.
            * @returns {string|null} - Parsed text error value, if available.
        */
        function getTextErrorValue(bodyText) {
            if (!bodyText) return null;

            const match = bodyText.match(/\berror(?:\s+code)?\s*:\s*(.+)/i);
            if (!match || !match[1]) return null;

            return match[1].trim().replace(/\.+$/, '');
        }

        /*
            * Get the best user-facing error message for a failed prediction response.
            * Prefer JSON error strings from Express, then text error values from
            * deployment infrastructure, then a generic status message.
            * @param {object|null} data - Parsed response body, if available.
            * @param {string} bodyText - Raw response body text.
            * @param {number} status - HTTP response status code.
            * @returns {string} - Error message to display.
        */
        function getErrorMessage(data, bodyText, status) {
            if (data && (typeof data.error === 'string' || typeof data.error === 'number')) {
                return String(data.error);
            }

            const textErrorValue = getTextErrorValue(bodyText);
            if (textErrorValue) return 'Error: ' + textErrorValue + '.';

            return 'Prediction request failed with status ' + status + '.';
        }

        /*
            * Submit article text to POST /api/predict, show loading state, and render
            * either the prediction result or an error message.
        */
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            const text = textInput.value.trim();
            if (!text) {
                setOutput('Please enter text before requesting a prediction.', 'error');
                textInput.focus();
                return;
            }

            button.disabled = true;
            setOutput('Loading prediction...', 'loading');

            try {
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: text }),
                });

                // Note that you must clone the response n-1 times, 
                // where n is the number of times you need to read the response
                // because the response is consumed after the first read
                const data = await parseJSONBody(response.clone());
                const bodyText = await response.text();

                if (!response.ok) {
                    throw new Error(getErrorMessage(data, bodyText, response.status));
                }

                if (!data) {
                    throw new Error('Prediction response was not valid JSON.');
                }

                // Validate the expected response shape before rendering fields.
                if (
                    typeof data.prediction !== 'string' ||
                    typeof data.model_version !== 'string' ||
                    typeof data.label_encoder_version !== 'string'
                ) {
                    throw new Error('Prediction response was missing expected fields.');
                }

                setResult(data);
            } catch (error) {
                const message = error && error.message
                    ? error.message
                    : 'Unable to fetch prediction.';
                setOutput(message, 'error');
            } finally {
                button.disabled = false;
            }
        });

        updateCharacterCount();
        textInput.addEventListener('input', updateCharacterCount);
    }

    // The script is currently placed at the end of the body, but this keeps it
    // safe if the template placement changes later.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPredictionForm);
    } else {
        initPredictionForm();
    }
})();
