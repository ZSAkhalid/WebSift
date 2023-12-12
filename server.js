//create the server
const { request, response } = require("express");
const express = require("express");
const app = express();
const path = require("path");
const router = express.Router();
require('dotenv').config();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');

// Setup session middleware
app.use(session({
    secret: 'yourSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1200000
  }
}));


// Setup flash middleware
app.use(flash());

app.use(cookieParser());

// Set the view engine to EJS with the views folder as the default location
app.set('views', path.join(__dirname, 'Views'));
app.set('view engine', 'ejs');

const { check, validationResult } = require("express-validator");

//Middleware
app.use('/', express.urlencoded({ extended: false }));
app.use('/', express.static(path.join(__dirname, "Public")));
app.use('/', express.json());

// Routers
app.use('/', require('./Routes/root'));

// Connect to DataBase and run the server
mongoose.connect(MONGO_URI)
.then(()=>{
  app.listen(PORT, () => {
    console.log("Connected to DB, and sever is running on port: " + PORT);
  });
})
.catch((error) => {
  console.log("ERROR occured while connecting to DB, error:"+ error);
});