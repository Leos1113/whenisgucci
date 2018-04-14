require("dotenv").config();

// NPM modules
const express      = require("express");
const nunjucks     = require("nunjucks");
const bodyParser   = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose     = require("mongoose");
const autoInc      = require("mongoose-auto-increment");
const Hashids      = require("hashids");
const hashids      = new Hashids(
  process.env.HASHIDS_EVENT_SALT,
  process.env.HASHIDS_EVENT_LENGTH,
  process.env.HASHIDS_EVENT_ALPHABET
);

// Setup MongoDB connection
mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
autoInc.initialize(db);
db.on("error", () => console.error("MongoDB connection error:"));
db.on("open", () => console.log("MongoDB connected."));

// User modules
const asyncMiddleware = require("./middlewares/async");
const Event           = require("./models/event");

// Variables
const app = express();
const isProduction = (process.env.NODE_ENV === "production") ? true : false;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Handle GET requests with IDs
app.get("/:id", asyncMiddleware(async (req, res, next) => {

  // Validate ID
  if (/[^23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ]/g.test(req.params.id))
    return res.redirect("https://whenisgucci.com/?utm_source=gucci4me&invalid-code=1")

  // Decode ID
  const id = hashids.decode(req.params.id)[0];

  // Redirect if decode unsuccessful
  if (id === undefined)
    return res.redirect("https://whenisgucci.com/?utm_source=gucci4me&invalid-code=2");

  // Find Event with ID
  const event = await Event.findOne({ _id: id }).exec();

  // Redirect if Event not found
  if (!event)
    return res.redirect("https://whenisgucci.com/?utm_source=gucci4me&invalid-code=3");

  // Redirect to the Event
  return res.redirect(`https://whenisgucci.com/event/${id}?utm_source=gucci4me`);
}));

// Catch everything else
app.all("*", (req, res, next) => {

  return res.redirect("https://whenisgucci.com/?utm_source=gucci4me&invalid-code=4")
});

// Catch errors and redirect
app.use((err, req, res, next) => {

  console.log(err);
  res.redirect("https://whenisgucci.com/?utm_source=gucci4me&invalid-code=5");
});

// Serve on :8081
app.listen(8081);
