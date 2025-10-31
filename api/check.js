import { getApiKeyForClass, isValidClassCode } from './config/classCodeMap.js';
import { buildCheckPrompt, GROQ_SETTINGS, SYSTEM_MESSAGE } from './config/prompt.js';
import { ERRORS, HTTP_STATUS } from './config/errors.js';
import { validateAndFixResponse } from './utils/responseValidator.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(HTTP_STATUS.OK).end();
  }

  if (req.method !== 'POST') {
    return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({ 
      error: 'Method not allowed' 
    });
  }

  try {
    const { text, classCode } = req.body;

    // Validate input
    if (!text) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERRORS.NO_TEXT 
      });
    }

    if (!classCode) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: ERRORS.NO_CLASS_CODE 
      });
    }

    // Validate class code and get API key
    if (!isValidClassCode(classCode)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: ERRORS.INVALID_CLASS_CODE 
      });
    }

    const apiKey = getApiKeyForClass(classCode);

    // Build the prompt
    const prompt = buildCheckPrompt(text);

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_SETTINGS.model,
        messages: [
          {
            role: "system",
            content: SYSTEM_MESSAGE
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: GROQ_SETTINGS.temperature,
        max_tokens: GROQ_SETTINGS.max_tokens,
        response_format: GROQ_SETTINGS.response_format
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle rate limiting
      if (response.status === 429) {
        return res.status(HTTP_STATUS.RATE_LIMIT).json({ 
          error: ERRORS.RATE_LIMIT_EXCEEDED 
        });
      }
      
      throw new Error(errorData.error?.message || ERRORS.GROQ_API_ERROR);
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content;
    
    // Clean up response
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsedFeedback = JSON.parse(responseText);
    
    // Validate and fix the response
    parsedFeedback = validateAndFixResponse(parsedFeedback);
    
    return res.status(HTTP_STATUS.OK).json(parsedFeedback);

  } catch (error) {
    console.error('Error:', error);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ 
      error: ERRORS.SERVER_ERROR,
      details: error.message 
    });
  }
}
