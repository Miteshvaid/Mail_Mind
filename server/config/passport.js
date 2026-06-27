const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const GmailAccount = require("../models/GmailAccount");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:5000/auth/google/callback";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("⚠️  WARNING: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing");
}

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
          const incomingEmail = profile.emails[0].value;

          // ✅ Pehle dekho yeh email already linked hai kisi account se
          let existingGmail = await GmailAccount.findOne({
            email: incomingEmail,
          });

          let user;

          if (existingGmail) {
            // ✅ Already linked — usi user ko lo, tokens update karo
            user = await User.findById(existingGmail.userId);

            // Tokens refresh karo
            existingGmail.accessToken = accessToken;
            if (refreshToken) existingGmail.refreshToken = refreshToken;
            existingGmail.tokenExpiry = new Date(Date.now() + 3600 * 1000);
            existingGmail.isActive = true;
            await existingGmail.save();

            return done(null, user);
          }

          // ✅ Naya email hai — check karo kya state mein userId hai (add-account flow)
          // Agar nahi hai, toh naya user banao
          user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.findOne({ email: incomingEmail });
          }

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              email: incomingEmail,
              name: profile.displayName,
              picture: profile.photos[0]?.value,
            });
          }

          // ✅ Naya GmailAccount banao
          await GmailAccount.create({
            userId: user._id,
            email: incomingEmail,
            googleId: profile.id,
            accessToken,
            refreshToken: refreshToken || null,
            tokenExpiry: new Date(Date.now() + 3600 * 1000),
            isActive: true,
          });

          done(null, user);
        } catch (error) {
          console.error("Passport strategy error:", error);
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
