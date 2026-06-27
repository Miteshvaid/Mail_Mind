const { callAI } = require('../config/ai');

// ============== RULE-BASED CATEGORIZATION (ZERO COST FALLBACK) ==============
const ruleBasedCategorize = (subject, body, from) => {
  const text = (subject + ' ' + body + ' ' + from).toLowerCase();
  
  const keywords = {
    Jobs: ['job', 'hiring', 'interview', 'offer', 'recruiter', 'linkedin', 'career', 'position', 'salary', 'resume', 'cv', 'application', 'applied', 'recruitment', 'talent', 'hr@', 'careers@', 'jobs@'],
    College: ['university', 'college', 'course', 'assignment', 'professor', 'campus', 'student', 'academic', 'semester', 'exam', 'lecture', 'edu', 'admission', 'scholarship', 'dean', 'registrar'],
    Shopping: ['order', 'shipped', 'delivery', 'amazon', 'flipkart', 'purchase', 'payment', 'receipt', 'invoice', 'cart', 'discount', 'coupon', 'promo', 'tracking', 'package', 'refund', 'order confirmation'],
    Spam: ['unsubscribe', 'promotional', 'limited time', 'click here', 'winner', 'lottery', 'free gift', 'act now', 'urgent', 'congratulations', 'prize', 'claim', 'suspicious']
  };
  
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      return { category, confidence: 0.7, reason: 'Rule-based keyword match' };
    }
  }
  
  return { category: 'Personal', confidence: 0.5, reason: 'Default - no keywords matched' };
};

const ruleBasedPriority = (subject, body) => {
  const text = (subject + ' ' + body).toLowerCase();
  const urgentWords = ['deadline', 'urgent', 'asap', 'immediate', 'today', 'tomorrow', 'expire', 'expires', 'due date', 'last day', 'final call'];
  const jobWords = ['offer', 'interview', 'hired', 'selected', 'shortlisted', 'congratulations', 'welcome aboard'];
  
  if (jobWords.some(w => text.includes(w))) {
    return { priority: 'high', hasDeadline: false, deadlineDate: null, reason: 'Job offer detected' };
  }
  
  if (urgentWords.some(w => text.includes(w))) {
    const dateMatch = body.match(/\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\b/);
    return {
      priority: 'medium',
      hasDeadline: true,
      deadlineDate: dateMatch ? new Date(dateMatch[0]) : null,
      reason: 'Deadline keywords found'
    };
  }
  
  return { priority: 'low', hasDeadline: false, deadlineDate: null, reason: 'No urgency detected' };
};

// Email Categorization
const categorizeEmail = async (subject, body, from) => {
  const prompt = `
You are an email categorization AI. Categorize this email into ONE category.

Categories:
- Jobs: Job offers, interviews, recruiter emails, LinkedIn job alerts, career opportunities
- College: University emails, course updates, assignment deadlines, professor emails, campus events
- Shopping: Order confirmations, shipping updates, promotional emails, receipts, e-commerce
- Personal: Family, friends, personal communications, social media notifications
- Spam: Unwanted marketing, phishing, suspicious links, unsolicited bulk emails
- Uncategorized: Doesn't fit above categories

Email:
From: ${from}
Subject: ${subject}
Body: ${body.substring(0, 3000)}

Respond ONLY as JSON:
{
  "category": "Jobs|College|Shopping|Personal|Spam|Uncategorized",
  "confidence": 0.0-1.0,
  "reason": "one line explanation"
}
`;

  try {
    const response = await callAI(prompt, 'You are a precise email categorization system. Always respond in valid JSON format only.');
    
    if (!response) {
      return ruleBasedCategorize(subject, body, from);
    }
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return ruleBasedCategorize(subject, body, from);
  } catch (error) {
    return ruleBasedCategorize(subject, body, from);
  }
};

// Email Summarization
const summarizeEmail = async (subject, body) => {
  const prompt = `
Summarize this email in 2-3 concise bullet points. Focus on key information and action items.

Subject: ${subject}
Email Content: ${body.substring(0, 3000)}

Respond with just the summary, no extra text.
`;

  try {
    const response = await callAI(prompt);
    if (!response) {
      return `• Subject: ${subject}\n• Preview: ${body.substring(0, 200)}...`;
    }
    return response.trim();
  } catch (error) {
    return `• Subject: ${subject}\n• Preview: ${body.substring(0, 200)}...`;
  }
};

// Reply Suggestions
const generateReplySuggestions = async (subject, body, from, tone = 'professional') => {
  const prompt = `
Generate 2 different ${tone} reply suggestions for this email. Keep them concise and natural.

Email from: ${from}
Subject: ${subject}
Content: ${body.substring(0, 2000)}

Respond in this format:
REPLY 1:
[first reply]

REPLY 2:
[second reply]
`;

  try {
    const response = await callAI(prompt);
    if (!response) {
      return [
        `Thank you for your email regarding "${subject}". I will review and get back to you shortly.`,
        `Thanks for reaching out. Regarding "${subject}", I appreciate the information and will follow up as needed.`
      ];
    }
    
    const replies = response
      .split(/REPLY \d+:/)
      .filter(r => r.trim())
      .map(r => r.trim());
    
    return replies.slice(0, 2);
  } catch (error) {
    return [
      `Thank you for your email regarding "${subject}". I will review and get back to you shortly.`,
      `Thanks for reaching out. Regarding "${subject}", I appreciate the information and will follow up as needed.`
    ];
  }
};

// Detect priority and deadlines
const analyzePriority = async (subject, body) => {
  const prompt = `
Analyze this email for urgency and deadlines. Respond ONLY in JSON:

{
  "priority": "high|medium|low",
  "hasDeadline": true|false,
  "deadlineDate": "YYYY-MM-DD" or null,
  "reason": "brief explanation"
}

Email:
Subject: ${subject}
Body: ${body.substring(0, 2000)}
`;

  try {
    const response = await callAI(prompt);
    if (!response) {
      return ruleBasedPriority(subject, body);
    }
    
    const jsonMatch = response.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return ruleBasedPriority(subject, body);
  } catch (error) {
    return ruleBasedPriority(subject, body);
  }
};

module.exports = {
  categorizeEmail,
  summarizeEmail,
  generateReplySuggestions,
  analyzePriority
};