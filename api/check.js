const { getApiKeyForClass, isValidClassCode } = require('./config/classCodeMap.js');
const { buildCheckPrompt, GROQ_SETTINGS, SYSTEM_MESSAGE } = require('./config/prompt.js');
const { ERRORS, HTTP_STATUS } = require('./config/errors.js');
const { validateAndFixResponse } = require('./utils/responseValidator.js');  // ← This line

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    if (!isValidClassCode(classCode)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        error: ERRORS.INVALID_CLASS_CODE 
      });
    }

    const apiKey = getApiKeyForClass(classCode);
    const prompt = buildCheckPrompt(text);

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
      
      if (response.status === 429) {
        return res.status(HTTP_STATUS.RATE_LIMIT).json({ 
          error: ERRORS.RATE_LIMIT_EXCEEDED 
        });
      }
      
      throw new Error(errorData.error?.message || ERRORS.GROQ_API_ERROR);
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content;
    
    responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsedFeedback = JSON.parse(responseText);
    parsedFeedback = validateAndFixResponse(parsedFeedback);
    
    return res.status(HTTP_STATUS.OK).json(parsedFeedback);

  } catch (error) {
    console.error('Error:', error);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ 
      error: ERRORS.SERVER_ERROR,
      details: error.message 
    });
  }
};
```

---

## **Final Structure:**
```
your-repo/
├── api/
│   ├── config/
│   │   ├── classCodeMap.js     ← Class codes mapping
│   │   ├── errors.js           ← Error messages
│   │   └── prompt.js           ← AI prompts & settings
│   ├── utils/
│   │   └── responseValidator.js ← Response validation logic
│   └── check.js                ← Main API handler
├── index.html                  ← Frontend
├── vercel.json                 ← Vercel config
└── README.md
