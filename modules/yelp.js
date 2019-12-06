require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const Error = require('./error');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

function Yelp(review) {
  this.name = review.name;
  this.rating = review.rating;
  this.price = review.price;
  this.url = review.url;
  this.image_url = review.image_url;
  this.created_at = Date.now();
}

Yelp.getYelp = (request, response) => {
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

client.connect();

module.exports = Yelp;
