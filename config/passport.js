// config/passport.js

// load all the things we need
import { Strategy as LocalStrategy } from 'passport-local'

// load up the user model
import { createConnection } from 'mysql'
import { hashSync, compareSync } from 'bcrypt-nodejs'
let dbconfig = require('./database').default.default
let connection = createConnection(dbconfig.connection)
connection.connect()
connection.query('USE ' + dbconfig.database)
connection.end()
// expose this function to our app using module.exports
export default passport => {

  // used to serialize the user for the session
  passport.serializeUser((user, done) => done(null, user.id))

  // used to deserialize the user
  passport.deserializeUser((id, done) => {
    connection.connect()
    connection.query('SELECT * FROM users WHERE id = ? ', [id], (err, rows) => {
      done(err, rows[0])
    })
    connection.end()
  })

  /** 
     * we are using named strategies since we have one for login and one for signup
     * by default, if there was no name, it would just be called 'local'
    */
  passport.use(
    'local-signup',
    new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    }, (req, username, password, done) => {
      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      connection.connect()
      connection.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
        if (err) { return done(err) }
        if (rows.length) {
          return done(null, false, req.flash('signupMessage', 'That username is already taken.'))
        } else {
          // if there is no user with that username
          // create the user
          let newUserMysql = {
            username: username,
            password: hashSync(password, null, null)  // use the generateHash function in our user model
          }

          let insertQuery = 'INSERT INTO users ( username, password ) values (?,?)'
          connection.connect()
          connection.query(insertQuery, [newUserMysql.username, newUserMysql.password], (err, rows) => {
            newUserMysql.id = rows.insertId
            return done(null, newUserMysql)
          })
          connection.end()
        }
      })
      connection.end()
    })
  )

  /** 
   * we are using named strategies since we have one for login and one for signup
   * by default, if there was no name, it would just be called 'local'
  */
  passport.use(
    'local-login',
    new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    }, (req, username, password, done) => { // callback with email and password from our form
      connection.connect()
      connection.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
        if (err) { return done(err) }
        if (!rows.length) {
          return done(null, false, req.flash('loginMessage', 'No user found.')) // req.flash is the way to set flashdata using connect-flash
        }

        // if the user is found but the password is wrong
        if (!compareSync(password, rows[0].password)) { return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')) } // create the loginMessage and save it to session as flashdata

        // all is well, return successful user
        return done(null, rows[0])
      })
      connection.end()
    })
  )
}
