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
function Movie(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/original${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
  this.created_at = Date.now();
}

// Get movies from API
Movie.fetchMovies = (request, response) => {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${request.query.data.search_query}`;
  return superagent.get(url)
    .then( data => {
      const movies = data.body.results.map(movie => {
        const info = new Movie(movie);
        info.save(request.query.data.id);
        return info
      });
      response.status(200).json(movies);
    })
    .catch(() => {
      let errorMessage = 'No movie information available';
      Error(errorMessage, request, response);
    });
}

// Save to Database
Movie.prototype.save = function(id){
  let SQL = `INSERT INTO movies
    (title, overview, average_votes, total_votes, image_url, popularity, released_on, created_at, location_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;`;

  let values = Object.values(this);
  values.push(id);
  return client.query(SQL, values);
};

// Check Database
Movie.lookup = (handler) => {
  const SQL = 'SELECT * FROM movies WHERE location_id=$1;';
  const values = [handler.query.id];
  return client.query(SQL, values)
    .then( results => {
      if(results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) < 43200000){ // data under a 1/2 day
        console.log('Got movie data from DB');
        handler.cacheHit(results);
      } else if (results.rowCount > 0 && (Date.now() - (results.rows[0].created_at)) >= 43200000) { // data 1/2 day or older
        console.log('Movies info too old, fetching new info from API');
        const sqlDelete = `DELETE FROM movies WHERE location_id=${[handler.query.id]}`;
        client.query(sqlDelete);
        handler.cacheMiss();
      } else {
        console.log('No movie data in DB, fetching...');
        handler.cacheMiss();
      }
    })
    .catch(console.error);
};

// Route Callback
Movie.getMovies = (request,response) => {
  const movieHandler = {
    query: request.query.data,
    cacheHit: (results) => {
      response.send(results.rows);
    },
    cacheMiss: () => {
      Movie.fetchMovies(request, response)
        .then( data => response.send(data));
    }
  };
  Movie.lookup(movieHandler);
}

client.connect();

module.exports = Movie;
