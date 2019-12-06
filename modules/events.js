const Error = require('./error');
const superagent = require('superagent');

const Event = function getEvents(request, response) {
  const url = 'placeholder';
  return superagent.get(url)
    .catch(() => {
      let errorMessage = 'No events information available';
      Error(errorMessage, request, response);
    });
}

module.exports = Event;
