require("dotenv").config();
const path = require("path");
// server run by node.js(express)
const express = require("express");
// google api to interact spreadsheet
const { google } = require("googleapis");

// spread sheet auth
const auth = new google.auth.GoogleAuth({
  keyFile: "credencials.json",
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

// client data to access spread sheet
const client = auth.getClient();

// spread sheet instance
const googleSheets = google.sheets({ version: "v4", auth: client });

// creates express app
const app = express();

// read static file
app.use(express.static(path.join(__dirname, "../public")));

// accept json stringify body from client
app.use(express.json());

// receive request from client with totalScore
app.post("/api/v1/add", async (req, res) => {
  // total score from body
  const totalScore = await parseInt(req.body.totalScore, 10);

  // spread sheet id
  const spreadsheetId = process.env.SPREAD_SHEET_ID;

  // write total score result to spread sheet
  // new data will be added new row, no worry about incerting data
  await googleSheets.spreadsheets.values.append({
    auth,
    spreadsheetId,
    range: "Sheet2!A:B",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [["score", totalScore]],
    },
  });

  // get row data
  const getRows = await googleSheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: "Sheet1",
  });

  const spreadSheetRows = getRows.data.values;

  const generateSuggestion = () => {
    let arrayOfArray = [];
    if (totalScore === 9) {
      arrayOfArray = [
        spreadSheetRows[totalScore - 3],
        spreadSheetRows[totalScore - 2],
        spreadSheetRows[totalScore - 1],
      ];
    } else if (totalScore === 4) {
      arrayOfArray = [
        spreadSheetRows[3],
        spreadSheetRows[4],
        spreadSheetRows[5],
      ];
    } else {
      arrayOfArray = [
        spreadSheetRows[totalScore - 2],
        spreadSheetRows[totalScore - 1],
        spreadSheetRows[totalScore],
      ];
    }

    // formatting data to response data to client nicely.
    const formattedResponse = arrayOfArray
      ? arrayOfArray.map((professor) => {
          if (professor) {
            return {
              first_name: professor[0],
              last_name: professor[1],
              score: professor[2],
              location: professor[3],
            };
          }
          return {};
        })
      : [];

    return formattedResponse;
  };

  // response back row data to client
  return res.json(generateSuggestion());
});

app.listen(3000, () => console.log("server started port 3000"));
