# Rebuild of City Explorer Node.js Server

**Author**: Holly Davis  
**Version**: 1.0.0  

## Overview
Create a Node.js server that connects to APIs that provide weather, restaurant, movie, and trail information to the [City Explorer site](city-explorer-code301.netlify.com). 

## Getting Started
1. Fork this repository
2. Clone it to your computer
3. Enter the following in your command line in the root directory for the repo: $ touch .env
4. Add your API keys and database url to the .env file
5. Confirm that node is installed: $ node -v (if not installed, do so)
6. To start your server: $ nodemon
7. Go to city-explorer-code301.netlify.com and enter "http://localhost:3000" in the field. Search for a city and you should see the location and weather information. 

## Architecture
This is a Node.js server that uses express, dotenv, cors, pg, and superagent packages.

## Change Log

12-03-2019 09:30 PM - initial file structure created, packages installed, dependencies and initial setup in server.js

12-03-2019 10:00 PM - created Location constructor and route

12-03-2019 11:00 PM - created getLocation function that calls Google API and renders location on front end's map (sets image placeholder source to API's URL)

12-04-2019 07:30 PM - added error handler function

12-04-2019 08:00 PM - created Weather constructor, route, and getWeather function

12-04-2019 10:20 PM - created Yelp constructor, route, and getYelp function

12-04-2019 11:00 PM - created Movie constructor, route, and getMovies function

12-04-2019 11:10 PM - created Trail constructor, route, and getTrails function

12-05-2019 11:40 PM - added tables to schema, created modules for each API and error function, added save functions for each API

12-06-2019 04:00 PM - fixed trails saving issue; added location lookup and cache result functions

12-07-2019 05:00 PM - added lookup and callback functions for APIs

## Credits and Collaborations
