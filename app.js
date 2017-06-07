
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

app.get('/search', function(request, response) {
  var desc = request.query.desc
  console.log(desc);
  db.query(`SELECT * FROM restaurant WHERE name ILIKE '%${desc}%'`)
    .then(function (dbresults) {
      console.log(dbresults);
      response.render('view.hbs', {title:'Results', dbresults: dbresults});
      })
})

app.get('/restaurant/:id', function(request, response, next) {
  let id = request.params.id;
  db.query(`SELECT *, restaurant.name as resname FROM restaurant \
    JOIN review ON restaurant.id = review.restaurant_id \
    JOIN reviewer ON reviewer.id = review.reviewer_id WHERE restaurant.id = '${id}'`)
  .then(function (results) {
    console.log(results)
    response.render('restaurant.hbs', {title:results.resname, results:results})
  })
  .catch(function rejected(err) {
    console.log('error:', err.stack);
    response.render(error)
  })
})
