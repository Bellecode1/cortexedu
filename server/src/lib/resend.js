const { Resend } = require("resend");

let resend;

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[WARN] RESEND_API_KEY n'est pas défini - les emails ne seront pas envoyés"
  );
  // Mock resend object for development
  resend = {
    emails: {
      send: async ({ to, subject }) => {
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
        return { id: "mock-email-id" };
      },
    },
  };
} else {
  resend = new Resend(process.env.RESEND_API_KEY);
}

module.exports = { resend };
