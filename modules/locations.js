require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const Error = require('./error');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

function Location(query, city){
  this.search_query = query;
  this.formatted_query = city.formatted_address;
  this.latitude = city.geometry.location.lat;
  this.longitude = city.geometry.location.lng;
  this.created_at = Date.now(); // will need this for cache invalidation once database setup
}

Location.getLocation = (request,response) => {
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

client.connect();

module.exports = Location;
