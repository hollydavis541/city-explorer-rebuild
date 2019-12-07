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
function Yelp(review) {
  this.name = review.name;
  this.rating = review.rating;
  this.price = review.price;
  this.url = review.url;
  this.image_url = review.image_url;
  this.created_at = Date.now();
}

// Get eateries from API
Yelp.fetchYelp = (request, response) => {
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;
  return superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then( data => {
      const eateries = data.body.businesses.map(eatery => {
        const info = new Yelp(eatery);
        info.save(request.query.data.id);
        return info
      });
      response.status(200).json(eateries);
    })
    .catch(() => {
      let errorMessage = 'No restaurant information available';
      Error(errorMessage, request, response);
    });
}

// Save to Database
Yelp.prototype.save = function(id){
  let SQL = `INSERT INTO yelp
    (name, rating, price, url, image_url, created_at, location_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;`;

  let values = Object.values(this);
  values.push(id);
  return client.query(SQL, values);
};

// Check Database
Yelp.lookup = (handler) => {
  const SQL = 'SELECT * FROM yelp WHERE location_id=$1;';
  const values = [handler.query.id];
  return client.query(SQL, values)
    .then( results => {
      if(results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) < 86400000){ // data under a day
        console.log('Got Yelp data from DB');
        handler.cacheHit(results);
      } else if (results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) >= 86400000) { // data a day or older
        console.log('Yelp info too old, fetching new info from API');
        const sqlDelete = `DELETE FROM yelp WHERE location_id=${[handler.query.id]}`;
        client.query(sqlDelete);
        handler.cacheMiss();
      } else {
        console.log('No Yelp data in DB, fetching...');
        handler.cacheMiss();
      }
    })
    .catch(console.error);
};

// Route Callback
Yelp.getYelp = (request,response) => {
  const yelpHandler = {
    query: request.query.data,
    cacheHit: (results) => {
      response.send(results.rows);
    },
    cacheMiss: () => {
      Yelp.fetchYelp(request, response)
        .then( data => response.send(data));
    }
  };
  Yelp.lookup(yelpHandler);
}

client.connect();

module.exports = Yelp;
