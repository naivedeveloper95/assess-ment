// server.js
'use strict'
// set up ======================================================================
// get all the tools we need
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import { urlencoded, json } from 'body-parser'
import morgan from 'morgan'
let app = express()
let port = process.env.PORT || 8080

import passport, { initialize, session as _session } from 'passport'
import flash from 'connect-flash'

require('./config/passport').default(passport) // pass passport for configuration



// set up our express application
app.use(morgan('dev')) // log every request to the console
app.use(cookieParser()) // read cookies (needed for auth)
app.use(urlencoded({
  extended: true
}))
app.use(json())

app.set('view engine', 'ejs') // set up ejs for templating

// required for passport
app.use(session({
  secret: 'jsdnKJbSJKDBEHJBCDJKSBVKLNSDJCn',
  resave: true,
  saveUninitialized: true
})) // session secret
app.use(initialize())
app.use(_session()) // persistent login sessions
app.use(flash()) // use connect-flash for flash messages stored in session


// routes ======================================================================
// routes ======================================================================
require('./app/routes.js').default(app, passport) // load our routes and pass in our app and fully configured passport

// launch ======================================================================
app.listen(port)
console.log('The magic happens on port ' + port)
