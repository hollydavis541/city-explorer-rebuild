'use strict';

// Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pg = require('pg');

// Modules
const Location = require('./modules/locations');
const Weather = require('./modules/weather');
const Yelp = require('./modules/yelp');
const Event = require('./modules/events');
const Movie = require('./modules/movies');
const Trail = require('./modules/trails');

// Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

// Routes
app.get('/location', Location.getLocation);
app.get('/weather', Weather.getWeather);
app.get('/yelp', Yelp.getYelp);
app.get('/events', Event);
app.get('/movies', Movie.getMovies);
app.get('/trails', Trail.getTrails);

client.connect()
  .then( ()=> {
    app.listen(PORT, ()=> {
      console.log('server and db are up, listening on port', PORT);
    });
  });
