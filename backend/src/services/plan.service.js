import { planRules } from '../constants/planRules.js';
export const getAllowedFeatures=(plan)=>planRules[plan]||new Set();
export const isFeatureAllowed=(plan,feature)=>getAllowedFeatures(plan).has(feature);
