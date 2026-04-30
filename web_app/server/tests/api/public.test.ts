/*
    * Description:
    * This file tests the prediction UI route and browser behavior, including
    * API submission, error handling, and character counter updates.
    *
    * Author: Osvaldo Hernandez-Segura
    * Date Created: April 28, 2026
    * Date Modified: April 28, 2026
    * References: Copilot, ChatGPT, Jest documentation
*/
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import vm from 'vm';
import app from '../../src/app';

describe('GET /predict', () => {
    it('should return the prediction UI with embedded styles and script', async () => {
        const res = await request(app).get('/predict');

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/html');
        expect(res.text).toContain('News Bias Prediction');
        expect(res.text).toContain('textarea');
        expect(res.text).toContain('Get Prediction');
        expect(res.text).toContain('Loading prediction...');
        expect(res.text).toContain("fetch('/api/predict'");
        expect(res.text).toContain('<style>');
        expect(res.text).toContain('<script>');
        expect(res.text).not.toContain('{{PUBLIC_CSS}}');
        expect(res.text).not.toContain('{{PUBLIC_SCRIPT}}');
    });
});

type ElementState = {
    addEventListener?: jest.Mock;
    className: string;
    disabled?: boolean;
    focus?: jest.Mock;
    innerHTML: string;
    maxLength?: number;
    textContent: string;
    value?: string;
    classList: {
        add: jest.Mock;
    };
};

/*
    * Create a lightweight mocked DOM element for executing the browser script in tests.
    * @param {Partial<ElementState>} overrides - Element fields to override for a test case.
    * @returns {ElementState} - Mocked element state used by the UI test harness.
*/
function createElementState(overrides: Partial<ElementState> = {}): ElementState {
    const element: ElementState = {
        className: '',
        innerHTML: '',
        textContent: '',
        classList: {
            add: jest.fn((className: string) => {
                element.className = element.className
                    ? `${element.className} ${className}`
                    : className;
            }),
        },
        ...overrides,
    };

    return element;
}

function expectedCharacterCount(count: number, maxLength: number | undefined) {
    return `${count}/${maxLength} characters`;
}

/*
    * Execute the real public.ts browser script in a mocked DOM environment.
    * @param {string} textValue - Initial textarea value for the test case.
    * @param {jest.Mock} fetchMock - Mock fetch implementation used by the script.
    * @returns {object} - Test harness exposing mocked elements and captured event handlers.
    * @throws {Error} - Throws if the script does not register the submit handler.
*/
function createPredictionUIHarness(textValue: string, fetchMock: jest.Mock) {
    let submitHandler: ((event: { preventDefault: jest.Mock }) => Promise<void>) | undefined;
    let inputHandler: (() => void) | undefined;
    const form = {
        addEventListener: jest.fn((eventName: string, handler: typeof submitHandler) => {
            if (eventName === 'submit') submitHandler = handler;
        }),
    };
    const textInput = createElementState({
        addEventListener: jest.fn((eventName: string, handler: () => void) => {
            if (eventName === 'input') inputHandler = handler;
        }),
        focus: jest.fn(),
        maxLength: -1,
        value: textValue,
    });
    const characterCount = createElementState();
    const button = createElementState({
        disabled: false,
    });
    const output = createElementState();
    const elementsById: Record<string, unknown> = {
        'prediction-form': form,
        'article-text': textInput,
        'article-character-count': characterCount,
        'predict-button': button,
        'prediction-output': output,
    };
    const documentMock = {
        readyState: 'complete',
        addEventListener: jest.fn(),
        getElementById: jest.fn((id: string) => elementsById[id] || null),
    };
    const script = fs.readFileSync(
        path.join(process.cwd(), 'public', 'public.ts'),
        'utf8',
    );

    vm.runInNewContext(script, {
        document: documentMock,
        Error,
        fetch: fetchMock,
        JSON,
        String,
    });

    if (!submitHandler) {
        throw new Error('Prediction form submit handler was not registered.');
    }

    // Expose captured event handlers so tests can simulate browser submit/input events.
    return {
        button,
        characterCount,
        fetchMock,
        input: () => inputHandler!(),
        output,
        submit: () => submitHandler!({ preventDefault: jest.fn() }),
        textInput,
    };
}

describe('prediction UI browser behavior', () => {
    it('posts text to /api/predict and renders a successful prediction', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                prediction: 'center',
                model_version: 'model_v1',
                label_encoder_version: 'encoder_v1',
            }),
        });
        const harness = createPredictionUIHarness(' Article text for prediction ', fetchMock);

        await harness.submit();

        expect(fetchMock).toHaveBeenCalledWith('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: 'Article text for prediction' }),
        });
        expect(harness.output.className).toBe('prediction-output success');
        expect(harness.output.innerHTML).toContain('center');
        expect(harness.output.innerHTML).toContain('model_v1');
        expect(harness.output.innerHTML).toContain('encoder_v1');
        expect(harness.button.disabled).toBe(false);
    });

    it('renders an API error when prediction fails', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Invalid request data' }),
        });
        const harness = createPredictionUIHarness('Article text for prediction', fetchMock);

        await harness.submit();

        expect(fetchMock).toHaveBeenCalledWith('/api/predict', expect.objectContaining({
            body: JSON.stringify({ text: 'Article text for prediction' }),
        }));
        expect(harness.output.className).toBe('prediction-output error');
        expect(harness.output.textContent).toBe('Invalid request data');
        expect(harness.button.disabled).toBe(false);
    });

    it('does not call the API for empty text input', async () => {
        const fetchMock = jest.fn();
        const harness = createPredictionUIHarness('   ', fetchMock);

        await harness.submit();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(harness.output.className).toBe('prediction-output error');
        expect(harness.output.textContent).toBe('Please enter text before requesting a prediction.');
        expect(harness.textInput.focus).toHaveBeenCalled();
    });

    it('shows the empty character count on load', () => {
        const fetchMock = jest.fn();
        const harness = createPredictionUIHarness('', fetchMock);

        expect(harness.characterCount.textContent)
            .toBe(expectedCharacterCount(0, harness.textInput.maxLength));
    });

    it('sets the textarea max length from the browser script constant', () => {
        const fetchMock = jest.fn();
        const harness = createPredictionUIHarness('', fetchMock);

        expect(harness.textInput.maxLength).not.toBe(-1);
        expect(harness.textInput.maxLength).toBeGreaterThan(0);
    });

    it('updates the character count for entered text', () => {
        const fetchMock = jest.fn();
        const harness = createPredictionUIHarness('', fetchMock);

        harness.textInput.value = 'hello world';
        harness.input();

        expect(harness.characterCount.textContent)
            .toBe(expectedCharacterCount(11, harness.textInput.maxLength));
    });

    it('shows the max character count for max-length text', () => {
        const fetchMock = jest.fn();
        const harness = createPredictionUIHarness('', fetchMock);
        const maxLength = harness.textInput.maxLength || 0;

        harness.textInput.value = 'a'.repeat(maxLength);
        harness.input();

        expect(harness.characterCount.textContent)
            .toBe(expectedCharacterCount(maxLength, harness.textInput.maxLength));
    });
});
