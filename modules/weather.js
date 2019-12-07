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
function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
  this.created_at = Date.now();
}

// Get weather from API
Weather.fetchWeather = (request, response) => {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  return superagent.get(url)
    .then( data => {
      const weather = data.body.daily.data.map(day => {
        const info = new Weather(day);
        info.save(request.query.data.id);
        return info
      });
      response.status(200).json(weather);
    })
    .catch(() => {
      let errorMessage = 'No weather information available';
      Error(errorMessage, request, response);
    });
}

// Save to Database
Weather.prototype.save = function(id){
  let SQL = `INSERT INTO weather
    (forecast, time, created_at, location_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id;`;

  let values = Object.values(this);
  values.push(id);
  return client.query(SQL, values);
};

// Check Database
Weather.lookup = (handler) => {
  const SQL = 'SELECT * FROM weather WHERE location_id=$1;';
  const values = [handler.query.id];
  return client.query(SQL, values)
    .then( results => {
      if(results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) < 3600000){ // data under an hour
        console.log('Got weather data from DB');
        handler.cacheHit(results);
      } else if (results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) >= 3600000) { // data an hour or older
        console.log('Weather info too old, fetching new info from API');
        const sqlDelete = `DELETE FROM weather WHERE location_id=${[handler.query.id]}`;
        client.query(sqlDelete);
        handler.cacheMiss();
      } else {
        console.log('No weather data in DB, fetching...');
        handler.cacheMiss();
      }
    })
    .catch(console.error);
};

// Route Callback
Weather.getWeather = (request,response) => {
  const weatherHandler = {
    query: request.query.data,
    cacheHit: (results) => {
      response.send(results.rows);
    },
    cacheMiss: () => {
      Weather.fetchWeather(request, response)
        .then( data => response.send(data));
    }
  };
  Weather.lookup(weatherHandler);
}

// Connect to Database
client.connect();

// Export Module
module.exports = Weather;
