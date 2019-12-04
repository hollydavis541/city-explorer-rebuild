'use strict';

// Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

// Constructors
function Location(query, city){
  this.search_query = query;
  this.address = city.formatted_address;
  this.latitude = city.geometry.location.lat;
  this.longitude = city.geometry.location.lng;
  this.created_at = Date.now(); // will need this for cache invalidation once database setup
}

// Routes
app.get('/location', getLocation);

// Route Handlers
// getLocation function

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
