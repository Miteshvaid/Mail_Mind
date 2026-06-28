const Imap = require("imap");
const { simpleParser } = require("mailparser");

class IMAPService {
  constructor(email, appPassword) {
    this.imap = new Imap({
      user: email,
      password: appPassword,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });
  }

  async fetchEmails(limit = 50) {
    return new Promise((resolve, reject) => {
      const emails = [];

      this.imap.once("ready", () => {
        this.imap.openBox("INBOX", false, (err) => {
          if (err) return reject(err);

          this.imap.search(["ALL"], (err, results) => {
            if (err) return reject(err);
            if (!results.length) {
              this.imap.end();
              return resolve([]);
            }

            const fetchResults = results.slice(-limit);
            const fetch = this.imap.fetch(fetchResults, {
              bodies: "",
              struct: true,
            });

            fetch.on("message", (msg, seqno) => {
              let email = { id: seqno };
              let bodyBuffer = "";

              msg.on("body", (stream, info) => {
                stream.on(
                  "data",
                  (chunk) => (bodyBuffer += chunk.toString("utf8")),
                );
                stream.once("end", () => {
                  email.rawBody = bodyBuffer;
                });
              });

              msg.once("attributes", (attrs) => {
                email.uid = attrs.uid;
                email.flags = attrs.flags;
              });

              msg.once("end", async () => {
                try {
                  const parsed = await simpleParser(email.rawBody);
                  emails.push({
                    id: email.uid,
                    subject: parsed.subject || "No Subject",
                    from: parsed.from?.text || "Unknown",
                    to: parsed.to?.text || "",
                    date: parsed.date,
                    body: parsed.text || parsed.html || "",
                    isRead: email.flags.includes("\\Seen"),
                    category: "Personal",
                  });
                } catch (e) {
                  console.error("Parse error:", e);
                }
              });
            });

            fetch.once("error", reject);
            fetch.once("end", () => {
              setTimeout(() => {
                this.imap.end();
                resolve(emails);
              }, 100);
            });
          });
        });
      });

      this.imap.once("error", reject);
      this.imap.connect();
    });
  }

  async markAsRead(uid) {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        this.imap.openBox("INBOX", false, (err) => {
          if (err) return reject(err);
          this.imap.addFlags([uid], ["\\Seen"], (err) => {
            if (err) return reject(err);
            this.imap.end();
            resolve(true);
          });
        });
      });
      this.imap.connect();
    });
  }
}

module.exports = IMAPService;
