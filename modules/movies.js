require('dotenv').config();
const superagent = require('superagent');
const pg = require('pg');
const Error = require('./error');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => console.error(err));

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

Movie.getMovies = (request, response) => {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${request.query.data.search_query}`;
  return superagent.get(url)
    .then( data => {
      const movies = data.body.results.map(movie => {
        return new Movie(movie);
      });
      response.status(200).json(movies);
    })
    .catch(() => {
      let errorMessage = 'No movie information available';
      Error(errorMessage, request, response);
    });
}

client.connect();

module.exports = Movie;