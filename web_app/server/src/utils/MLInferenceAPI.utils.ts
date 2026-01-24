/*
    * Description:
    * This module handles the configuration for getting the API key and URL to the ML Inference API.
    * It reads the API key from a file and retrieves the API URL from environment variables.
    *
    * Author: 
    * Osvaldo Hernandez-Segura
*/
import fs from 'fs';

const INFERENCE_API_KEY_PATH = String(process.env.INFERERENCE_API_KEY || '');

if (!INFERENCE_API_KEY_PATH) {
    throw new Error('Inference API key path not found');
}

const INFERENCE_API_KEY = fs.readFileSync(String(process.env.INFERERENCE_API_KEY) || '', 'utf8').trim();

const INFERENCE_API_URL = String(process.env.INFERENCE_API_URL || '');

if (!INFERENCE_API_URL) {
    throw new Error('Inference API URL not found');
}

export { INFERENCE_API_KEY, INFERENCE_API_URL };
