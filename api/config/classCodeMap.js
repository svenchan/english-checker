/**
 * Class Code to API Key Mapping
 */

const CLASS_CODE_MAP = {
  'CLASS11': process.env.GROQ_API_KEY_11,
  'CLASS12': process.env.GROQ_API_KEY_12,
  'CLASS13': process.env.GROQ_API_KEY_13,
  'CLASS21': process.env.GROQ_API_KEY_21,
  'CLASS22': process.env.GROQ_API_KEY_22,
  'CLASS23': process.env.GROQ_API_KEY_23,
  'CLASS31': process.env.GROQ_API_KEY_31,
  'CLASS32': process.env.GROQ_API_KEY_32,
  'CLASS33': process.env.GROQ_API_KEY_33,
  'TEACHER': process.env.GROQ_API_KEY_TEACHER,
  // Add more classes here as needed
};

function isValidClassCode(code) {
  return code.toUpperCase() in CLASS_CODE_MAP;
}

function getApiKeyForClass(code) {
  const apiKey = CLASS_CODE_MAP[code.toUpperCase()];
  if (!apiKey) {
    throw new Error(`No API key found for class code: ${code}`);
  }
  return apiKey;
}

function getAllClassCodes() {
  return Object.keys(CLASS_CODE_MAP);
}

module.exports = {
  CLASS_CODE_MAP,
  isValidClassCode,
  getApiKeyForClass,
  getAllClassCodes
};
