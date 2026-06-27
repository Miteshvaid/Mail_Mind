const axios = require("axios");

// ============== GOOGLE GEMINI (FREE) ==============
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const callGemini = async (prompt) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(
      "Gemini Error:",
      error.response?.data?.error?.message || error.message,
    );
    throw error;
  }
};

// ============== GROQ (FREE TIER - FAST) ==============
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const callGroq = async (prompt, systemPrompt = "") => {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.1-8b-instant",
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      },
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(
      "Groq Error:",
      error.response?.data?.error?.message || error.message,
    );
    throw error;
  }
};

// ============== SMART AI CALLER (Auto-fallback) ==============
const callAI = async (prompt, systemPrompt = "") => {
  // Try Gemini first (free)
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(prompt);
    } catch (err) {
      console.log("Gemini failed, trying Groq...");
    }
  }

  // Try Groq backup (free tier)
  if (process.env.GROQ_API_KEY) {
    try {
      return await callGroq(prompt, systemPrompt);
    } catch (err) {
      console.log("Groq failed, using rule-based...");
    }
  }

  // Fallback - return null so caller knows to use rule-based
  return null;
};

module.exports = { callAI, callGemini, callGroq };
