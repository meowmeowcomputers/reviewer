
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
var session = require('express-session');
var pbkdf2 = require('pbkdf2');
var crypto = require('crypto');


app.set('view engine', 'hbs');

app.use(function (request, response, next) {
  console.log(request.method, request.path);
  next();
});

app.use(body_parser.urlencoded({extended: false}));

app.use(express.static('public'));

//Listening on port
app.listen(8003, function () {
  console.log('Listening on port 8003');
});

//Session handling
app.use(session( {
  secret: process.env.SECRET_KEY || 'dev',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 600000}
}));

//Login check
app.use(function(request, response, next){
  if (request.session.user) {
    next();
  }
  else if (request.path == '/login') {
    next();
  }
  else {
    response.redirect('/login');
  }
});

app.get('/login', function (request, response) {
  response.render('login.hbs');
});

//Check password
function check(stored_pass, password) {
  var pass_parts = stored_pass.split('$');
  var key = pbkdf2.pbkdf2Sync(
    password,
    pass_parts[2],
    parseInt(pass_parts[1]),
    256, 'sha256'
  );
  var hash = key.toString('hex');
  if (hash === pass_parts[3]) {
    return true;
  }
  else {
    console.log('No match!')
    return false;
  }
}

//Login page
app.post('/login', function (request, response) {
  var username = request.body.username;
  var password = request.body.password;
  console.log('User inputted password '+password)
  db.query(`SELECT password FROM reviewer WHERE name = '${username}'`)
  .then(function(dbresult) {
    var resultstr = dbresult[0].password;
    if (check(resultstr, password)) {
      request.session.user = username;
      response.redirect('/');
    } else {
      response.render('login.hbs');
    }
  })
});

//homepage
app.get('/', function (request, response) {
  response.render('home.hbs', {});
});

//Search page
app.get('/search', function(request, response) {
  var desc = request.query.desc
  console.log(desc);
  db.query(`SELECT * FROM restaurant WHERE name ILIKE '%${desc}%'`)
    .then(function (dbresults) {
      console.log(dbresults);
      response.render('view.hbs', {title:'Results', dbresults: dbresults});
      })
})
//Generate restaurant pages
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
//Create an account page
app.get('/account', function(request, response) {
  response.render('account.hbs', {title:'Create account'});
})

//Create hash function
function hash(password) {
  var salt = crypto.randomBytes(20).toString('hex');
  var key = pbkdf2.pbkdf2Sync(
  password, salt, 36000, 256, 'sha256'
  );
  var hash = key.toString('hex');
  var mash = [hash, salt];
  return mash;
}
//Hash new password
function storehash(mash){
  var hashed = mash[0];
  var salt = mash[1];
  var stored_pass = `pbkdf2_sha256$36000$${salt}$${hashed}`;
  return stored_pass
}

//Create an account action
app.post('/account', function(request, response) {
  var username = request.body.username;
  var password = request.body.password;
  var mashed = storehash(hash(password));
  console.log("Hashed password: "+mashed);
  var email = request.body.email;
  db.query(`INSERT INTO "public"."reviewer"("id", "name", "email", "password") \
  VALUES(nextval('reviewer_id_seq'), '${username}', '${email}', '${mashed}')`)
})

//login page
app.post('/login', function (request, response) {
  var username = request.body.username;
  var password = request.body.password;
  console.log('User inputted password '+password)
  db.query(`SELECT password FROM reviewer WHERE name = '${username}'`)
  .then(function(dbresult) {
    var resultstr = dbresult[0].password;
    if (check(resultstr, password)) {
      request.session.user = username;
      response.redirect('/');
    }
    //add if (request.path == '/newreview') {response.redirect('/login')}
    else {
      response.render('login.hbs');
    }
  })
});

//Confirmation page
app.get('/create', function(request, response) {
  response.render('create.hbs', {title: 'Account created'})
})
