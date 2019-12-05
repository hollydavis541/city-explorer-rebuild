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
  this.formatted_query = city.formatted_address;
  this.latitude = city.geometry.location.lat;
  this.longitude = city.geometry.location.lng;
  this.created_at = Date.now(); // will need this for cache invalidation once database setup
}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
  this.created_at = Date.now();
}

function Yelp(review) {
  this.name = review.name;
  this.rating = review.rating;
  this.price = review.price;
  this.url = review.url;
  this.image_url = review.image_url;
  this.created_at = Date.now();
}

function Movies(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/original${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
  this.created_on = Date.now();
}

// Routes
app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/yelp', getYelp);
app.get('/movies', getMovies);

// Route Handlers
function getLocation(request,response) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then( data => {
      const location = new Location(request.query.data, data.body.results[0]);
      response.status(200).json(location);
    })
    .catch( () => errorHandler('Not a valid location', request, response));
}

function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  return superagent.get(url)
    .then( data => {
      const weather = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weather);
    })
    .catch( () => errorHandler('No weather information available', request, response));
}

function getYelp(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;
  return superagent.get(url)
    .set('Authorization', `Bearer ${process.env.YELP_API_KEY}`)
    .then( data => {
      const eateries = data.body.businesses.map(eatery => {
        return new Yelp(eatery);
      });
      response.status(200).json(eateries);
    })
    .catch( () => errorHandler('No restaurant information available', request, response));
}

function getMovies(request, response) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${request.query.data.search_query}`;
  console.log(url);
  return superagent.get(url)
    .then( data => {
      const movies = data.body.results.map(movie => {
        return new Movies(movie);
      });
      response.status(200).json(movies);
    })
    .catch( () => errorHandler('No movie information available', request, response));
}

// Error Handler
function errorHandler(error, request, response) {
  response.status(500).send(console.error(error));
}

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
