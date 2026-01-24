import PredictModel from '../models/predict.model';
import { INFERENCE_API_URL, INFERENCE_API_KEY } from './MLInferenceAPI.utils';

const predictModel = new PredictModel(INFERENCE_API_URL, INFERENCE_API_KEY);

export default predictModel;
