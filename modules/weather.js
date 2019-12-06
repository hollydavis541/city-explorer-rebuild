require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const Error = require('./error');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
  this.created_at = Date.now();
}

Weather.getWeather = (request, response) => {
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

client.connect();

module.exports = Weather;
