(function () {
    const form = document.getElementById('prediction-form');
    const textInput = document.getElementById('article-text');
    const button = document.getElementById('predict-button');
    const output = document.getElementById('prediction-output');

    function setOutput(message, state) {
        output.className = 'prediction-output';
        if (state) output.classList.add(state);
        output.textContent = message;
    }

    function setResult(data) {
        output.className = 'prediction-output success';
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

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getErrorMessage(data, status) {
        if (data && typeof data.error === 'string') return data.error;
        return 'Prediction request failed with status ' + status + '.';
    }

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
            setOutput(error.message || 'Unable to fetch prediction.', 'error');
        } finally {
            button.disabled = false;
        }
    });
})();
