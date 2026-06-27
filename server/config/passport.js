const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const GmailAccount = require("../models/GmailAccount");

// ✅ SAFE: Agar env missing hai toh warning deke skip karo
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:5000/auth/google/callback";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "⚠️  WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in .env",
  );
  console.warn("   Google OAuth will NOT work. Add credentials to .env file.");
  console.warn("   Server will start but /auth/google routes will fail.");
}

// Only setup strategy if credentials exist
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_REDIRECT_URI,
        scope: [
          "profile",
          "email",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.modify",
          "https://www.googleapis.com/auth/gmail.send",
        ],
        accessType: "offline",
        prompt: "consent",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              picture: profile.photos[0]?.value,
            });
          }

          await GmailAccount.findOneAndUpdate(
            { userId: user._id, email: profile.emails[0].value },
            {
              userId: user._id,
              email: profile.emails[0].value,
              googleId: profile.id,
              accessToken,
              refreshToken,
              tokenExpiry: new Date(Date.now() + 3600 * 1000),
            },
            { upsert: true, new: true },
          );

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      },
    ),
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
