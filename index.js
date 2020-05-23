// const express = require("express");
// const axios = require("axios");
// const nodemailer = require("nodemailer");

// const app = express();
// app.use(express.json());

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "process.env.user",
//     pass: "process.env.pass",
//   },
// });

// const mailOptions = {
//   from: "process.env.from",
//   to: "process.env.to",
//   subject: "Testando o role",
//   text: "ITS WORKSSSSS",
// };

// transporter.sendMail(mailOptions, (err, data) => {
//   if (err) {
//     console.log(err);
//   } else {
//     console.log("email Send");
//   }
// });

// app.listen(3333);

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
require("dotenv").config();

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = "token.json";

const AUTH = {
  installed: {
    client_id: process.env.client_id,
    project_id: process.env.project_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_secret: process.env.client_secret,
    redirect_uris: ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
  },
};

// fs.readFile("credentials.json", (err, content) => {
//   if (err) return console.log("Error loading client secret file:", err);
//   // authorize(JSON.parse(content), listLabels);
//   authorize(JSON.parse(content), checkNote);
// });

setInterval(() => {
  authorize(AUTH, checkNote);
}, 4000);

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listLabels(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.labels.list(
    {
      userId: "me",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const labels = res.data.labels;
      if (labels.length) {
        console.log("Labels:");
        labels.forEach((label) => {
          console.log(`- ${label.name}`);
        });
      } else {
        console.log("No labels found.");
      }
    }
  );
}

function checkNote(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.threads.list(
    {
      userId: "me",
      maxResults: 2,
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const notes = res.data.threads;
      console.log(notes);
    }
  );
}
