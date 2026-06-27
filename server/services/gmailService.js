const { google } = require("googleapis");
const GmailAccount = require("../models/GmailAccount");

// OAuth2 client create karo
const createOAuth2Client = (accessToken, refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
};

// Token refresh karne ka function
const refreshAccessToken = async (account) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2Client.setCredentials({ refresh_token: account.refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update database mein new token
  account.accessToken = credentials.access_token;
  account.tokenExpiry = new Date(credentials.expiry_date);
  await account.save();

  return credentials.access_token;
};

// Get Gmail client with auto-refresh
const getGmailClient = async (account) => {
  // Check if token expired
  if (new Date() >= account.tokenExpiry) {
    await refreshAccessToken(account);
  }

  const auth = createOAuth2Client(account.accessToken, account.refreshToken);
  return google.gmail({ version: "v1", auth });
};

// Fetch emails from Gmail
const fetchEmails = async (account, maxResults = 50) => {
  try {
    const gmail = await getGmailClient(account);

    // List messages
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      labelIds: ["INBOX"], // Sirf inbox se fetch karo
    });

    const messages = response.data.messages || [];
    const emails = [];

    // Har message ka detail fetch karo
    for (const message of messages) {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const emailData = parseEmailData(detail.data, account);
      emails.push(emailData);
    }

    return emails;
  } catch (error) {
    console.error("Gmail fetch error:", error);
    throw error;
  }
};

// Parse Gmail API response to our format
const parseEmailData = (message, account) => {
  const headers = message.payload.headers;

  const getHeader = (name) => {
    return headers.find((h) => h.name === name)?.value || "";
  };

  // Body extract karo (plain text)
  let body = "";
  let bodyHtml = "";

  const extractBody = (parts) => {
    if (!parts) return;

    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        bodyHtml = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      if (part.parts) {
        extractBody(part.parts);
      }
    }
  };

  if (message.payload.parts) {
    extractBody(message.payload.parts);
  } else if (message.payload.body?.data) {
    body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
  }

  // From field se name aur email alag karo
  const fromField = getHeader("From");
  const fromMatch = fromField.match(/(.+?)\s*<(.+)>/);
  const fromName = fromMatch
    ? fromMatch[1].replace(/"/g, "").trim()
    : fromField;
  const fromEmail = fromMatch ? fromMatch[2] : fromField;

  return {
    gmailMessageId: message.id,
    threadId: message.threadId,
    from: fromEmail,
    fromName,
    to: getHeader("To")
      .split(",")
      .map((e) => e.trim()),
    subject: getHeader("Subject"),
    body: body.substring(0, 10000), // Limit body size
    bodyHtml: bodyHtml.substring(0, 50000),
    snippet: message.snippet,
    labels: message.labelIds || [],
    isRead: !message.labelIds?.includes("UNREAD"),
    isImportant: message.labelIds?.includes("IMPORTANT"),
    receivedAt: new Date(parseInt(message.internalDate)),
  };
};

// Send email via Gmail API
const sendEmail = async (account, { to, subject, body, threadId }) => {
  const gmail = await getGmailClient(account);

  const emailContent = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\n");

  const encodedEmail = Buffer.from(emailContent)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedEmail,
      threadId,
    },
  });

  return response.data;
};

module.exports = {
  fetchEmails,
  sendEmail,
  refreshAccessToken,
  getGmailClient,
};
