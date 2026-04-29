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
    // Keep this aligned with the textarea maxlength and backend request schema.
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
            * Get the best user-facing error message for a failed prediction response.
            * "Best" means preferring a specific backend-provided error string when
            * available, then falling back to a generic HTTP status message so the UI
            * still gives clear feedback when the response body has no usable error.
            * @param {object|null} data - Parsed response body, if available.
            * @param {number} status - HTTP response status code.
            * @returns {string} - Error message to display.
        */
        function getErrorMessage(data, status) {
            if (data && typeof data.error === 'string') return data.error;
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

                let data = null;
                try {
                    data = await response.json();
                } catch (_error) {
                    throw new Error('Prediction response was not valid JSON.');
                }

                if (!response.ok) {
                    throw new Error(getErrorMessage(data, response.status));
                }

                // Validate the expected response shape before rendering fields.
                if (
                    !data ||
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
