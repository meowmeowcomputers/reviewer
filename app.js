
var express = require('express');
var app = express();
var body_parser = require('body-parser');
var promise = require('bluebird');
var pgp = require('pg-promise')({
  promiseLib: promise
});
var db = pgp({database:'restaurant'
  //
  });
var hbs = require('hbs');

app.set('view engine', 'hbs');

app.use(body_parser.urlencoded({extended: false}));

app.use(express.static('public'));

app.listen(8003, function () {
  console.log('Listening on port 8003');
});

app.get('/', function (request, response) {
  response.render('home.hbs', {});
});
