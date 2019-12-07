'use strict';

// Dependencies
require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const Error = require('./error');

// Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));


// Constructor
function Location(query, city){
  this.search_query = query;
  this.formatted_query = city.formatted_address;
  this.latitude = city.geometry.location.lat;
  this.longitude = city.geometry.location.lng;
  this.created_at = Date.now();
}

// Get location from API
Location.fetchLocation = (request,response) => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then( data => {
      const location = new Location(request.query.data, data.body.results[0]);
      return location.save()
        .then( result => {
          location.id = result.rows[0].id;
          response.status(200).json(location);
        })
        .catch( () => Error('Not a valid location', request, response));
    })
}

// Save to Database
Location.prototype.save = function() {
  const SQL = `INSERT INTO locations
  (search_query, formatted_query, latitude, longitude, created_at)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *`;

  let values = Object.values(this);
  return client.query(SQL, values);
};

// Check Database
Location.lookup = handler => {
  const SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  const values = [handler.query];
  return client.query(SQL, values)
    .then( results => {
      if (results.rowCount > 0) {
        console.log('Got location data from DB');
        handler.cacheHit(results);
      } else {
        console.log('No location data in DB, fetching...');
        handler.cacheMiss(results);
      }
    })
    .catch(console.error);
};

Location.getLocation = (request, response) => {
  const locationHandler = {
    query: request.query.data,
    cacheHit: (results) => {
      response.send(results.rows[0]);
    },
    cacheMiss: () => {
      Location.fetchLocation(request, response)
        .then( data => response.send(data));
    }
  };
  Location.lookup(locationHandler);
}

client.connect();

module.exports = Location;
