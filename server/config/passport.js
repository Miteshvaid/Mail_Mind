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

          // Pehle dekho kya yeh Gmail already linked hai
          let gmailAccount = await GmailAccount.findOne({
            email: incomingEmail,
          });

          let user;

          if (gmailAccount) {
            // Already linked — usi user ko lo
            user = await User.findById(gmailAccount.userId);
          } else {
            // Naya account — existing user dhundo
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
          }

          // GmailAccount update karo ya banao
          await GmailAccount.findOneAndUpdate(
            { email: incomingEmail },
            {
              userId: user._id,
              email: incomingEmail,
              googleId: profile.id,
              accessToken,
              refreshToken: refreshToken || gmailAccount?.refreshToken,
              tokenExpiry: new Date(Date.now() + 3600 * 1000),
              isActive: true,
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
