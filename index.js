express = require("express");
cors = require("cors");
dotenv = require("dotenv");
mistral = require("@mistralai/mistralai");

dotenv.config();

const app = express();
const mistralClient = new mistral.Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

app.use(cors({
  origin: "https://what-if-it-hits.vercel.app/",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

app.options("*", cors());

app.get("/getStyle", async (_, result) => {
  const apiKey = process.env.MAP_TILER_API_KEY;
  const style = await fetch(`https://api.maptiler.com/maps/openstreetmap/style.json?key=${apiKey}`);
  const data = await style.json();

  result.json(data);
});

app.get("/getSearchResults", async (request, result) => {
  const query = request.query.query;
  const results = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&accept-language=en`);
  const data = await results.json();

  result.json(data);
});

app.get("/askAI", async (request, result) => {
  const latitude = request.query.latitude;
  const longitude = request.query.longitude;
  const craterRadiusMeters = request.query.craterRadiusMeters;
  const results = await mistralClient.chat.complete({
    model: "mistral-large-latest",
    messages: [
      {
        role: "user",
        content: `A meteor has struct our Earth at latitude = ${latitude}, longitude = ${longitude} and its radius is ${craterRadiusMeters} meter(s)! Tell me about the exact outcomes of such situation. But, I want you to be brief about it and please do not use markdown styling, e.g.: **bolden text**. I also want you to distinct between  (and these values are not supposed to be interpreted as actual, real values i give you to analyze, following are just for you to learn but not use in your response): 98.2km and 98,200km, where the first one means 98 kilometers and 200 meters, and the second one means 98 thousand and 200 kilometers.`
      }
    ]
  });

  const data = results.choices[0].message.content;

  result.send(data);
});

app.get("/aiQuickConclusion", async (request, result) => {
  const wholeMessage = request.query.wholeMessage;
  const results = await mistralClient.chat.complete({
    model: "mistral-small-latest",
    messages: [
      {
        role: "user",
        content: `Can you please conclude the following informations into a really, really brief overview, 2 sentences tops. I also do not want you to use markdown styling, e.g.: **bold text**. I also want you to distinct between (and these values are not supposed to be interpreted as actual, real values i give you to analyze, following are just for you to learn but not use in your response): 98.2km and 98,200km, where the first one means 98 kilometers and 200 meters, and the second one means 98 thousand and 200 kilometers. The message to conclude: ${wholeMessage}`
      }
    ]
  });

  const data = results.choices[0].message.content;

  result.send(data);
});

app.listen(3001, () => console.log("Server's live now!"));
