require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const Error = require('./error');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

function Trail(trail) {
  this.name = trail.name;
  this.location = trail.location;
  this.length = trail.length;
  this.stars = trail.stars;
  this.star_votes = trail.starVotes;
  this.summary = trail.summary;
  this.trail_url = trail.url;
  this.conditions = trail.conditionStatus;
  this.condition_date = trail.conditionDate;
  this.condition_time = trail.conditionDate;
  this.created_at = Date.now();
}

Trail.getTrails = (request, response) => {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&key=${process.env.TRAIL_API_KEY}`
  return superagent.get(url)
    .then( data => {
      const trails = data.body.trails.map(trail => {
        const info = new Trail(trail);
        info.save(request.query.data.id);
        return info
      });
      response.status(200).json(trails);
    })
    .catch(() => {
      let errorMessage = 'No trail information available';
      Error(errorMessage, request, response);
    });
}

// Save to Database
Trail.prototype.save = function(id){
  let SQL = `INSERT INTO trails
    (name, location, length, stars, star_votes, summary, trail_url, conditions, condition_date, condition_time, created_at, location_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id;`;

  let values = Object.values(this);
  values.push(id);
  return client.query(SQL, values);
};

client.connect();

module.exports = Trail;
