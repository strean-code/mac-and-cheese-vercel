import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import pageRoutes from "./routes/pages.js";
import { recipes } from "./data/recipes.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const cooldowns = new Map();
const COOLDOWN_MS = 5000; // 5 seconds

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => {
  res.send("OK");
});

const recipeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per window
  message: {
    error: "Too many recipes generated. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// serve static files (css, images, js)
app.use(express.static(path.join(__dirname, "public")));
// router
//app.use("/", pageRoutes);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/generator", (req, res) => {
  res.render("generator");
});

app.get("/history", (req, res) => {
  res.render("history");
});

app.get("/lab", (req, res) => {
  res.render("lab");
});

app.get("/recipes", (req, res) => {
  res.render("recipes");
});

app.get("/around-the-world", (req, res) => {
  res.render("around-the-world");
});

app.get("/boxed-reviews", (req, res) => {
  res.render("boxed-reviews");
});

app.get("/upgrade-boxed", (req, res) => {
  res.render("upgrade-boxed");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/best-cheese-mac-and-cheese", (req,res)=>{
res.render("best-cheese");
});

app.get("/how-to-make-mac-and-cheese-creamy",(req,res)=>{
res.render("creamy-mac");
});

app.get("/what-to-add-to-mac-and-cheese",(req,res)=>{
res.render("mac-addins");
});

app.get("/mac-and-cheese-toppings",(req,res)=>{
res.render("mac-toppings");
});

app.get("/recipes/:slug", (req, res) => {

  const recipe = recipes[req.params.slug];

  if (!recipe) {
    return res.status(404).send("Recipe not found");
  }

  res.render("recipe", { recipe });

});

// old route for homepage
//app.get("/", (req, res) => {
//  res.sendFile(path.join(__dirname, "views", "index.html"));
//});

// route for other pages
//app.get("/generator", (req, res) => {
//  res.sendFile(path.join(__dirname, "views", "generator.html"));
//});

//app.get("/lab", (req, res) => {
//  res.sendFile(path.join(__dirname, "views", "lab.html"));
//});

//app.get("/around-the-world", (req, res) => {
//  res.sendFile(path.join(__dirname, "views", "around-the-world.html"));
//});

//app.get("/history", (req, res) => {
//  res.sendFile(path.join(__dirname, "views", "history.html"));
//});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI Recipe Endpoint
app.post("/generate-recipe", recipeLimiter, async (req, res) => {
//  const { pasta, selectedCheeses, selectedAddins, topping, heat } = req.body;

  const ip = req.ip;
  const now = Date.now();

  if (cooldowns.has(ip)) {
    const lastRequest = cooldowns.get(ip);

    if (now - lastRequest < COOLDOWN_MS) {
      return res.status(429).json({
        error: "Please wait a few seconds before generating another recipe."
      });
    }
  }

  cooldowns.set(ip, now);

const { 
  pasta, 
  selectedCheeses = [], 
  selectedAddins = [], 
  topping, 
  heat,
  recaptchaToken 
} = req.body;

const verifyURL = `https://www.google.com/recaptcha/api/siteverify`;

const verifyResponse = await fetch(verifyURL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: `secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`
});

const verifyData = await verifyResponse.json();

if (!verifyData.success) {
  return res.status(403).json({ error: "reCAPTCHA verification failed." });
}

  try {
//    const completion = await openai.chat.completions.create({
//      model: "gpt-4o-mini",
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  response_format: { type: "json_object" },
messages: [
{
role: "system",
content: "You are a professional chef specializing in macaroni and cheese recipes."
},
{
role: "user",
content: `
Create a creative macaroni and cheese recipe.

User selections:
Pasta: ${pasta}
Cheeses: ${selectedCheeses.join(", ") || "chef's choice"}
Add-ins: ${selectedAddins.join(", ") || "none"}
Topping: ${topping}
Heat level: ${heat}

Return JSON in this format:

{
"title": "Recipe name",
"ingredients": ["item1","item2"],
"instructions": ["step1","step2"],
"prep_time": "time",
"cook_time": "time",
"creaminess_rating": "1-10",
"flavor_profile": "description"
}
`
}
],
      temperature: 0.8,
      max_tokens: 500
    });

//    res.json({ recipe: completion.choices[0].message.content });
let content = completion.choices[0].message.content;

// Remove possible markdown code blocks
content = content.replace(/```json/g, "").replace(/```/g, "").trim();

// Replace the next 2 lines with code thru new res.json to return image and recipe together
//const recipe = JSON.parse(content);
//res.json(recipe);

const recipe = JSON.parse(content);

// Generate food image
const image = await openai.images.generate({
  model: "gpt-image-1",
  prompt: `A delicious bowl of ${recipe.title}, gourmet macaroni and cheese, food photography, warm lighting, high detail`,
  size: "1024x1024"
});
//
// Return recipe + image
res.json({
  ...recipe,
  image: image.data[0].b64_json
});


  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});