const Error = function errorHandler(message, request, response) {
  let errorObject = {
    status: 500,
    responseText: message
  };
  response.status(errorObject.status).send(errorObject.responseText).send(console.log(errorObject));
}

module.exports = Error;
