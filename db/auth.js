import session from "express-session";
import passport from "passport";
let LocalStrategy = require("passport-local").Strategy;
import models from './models';
import bodyParser from 'body-parser';
import ejwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
const _SECRET = `no one will guess THIS`;

export const createJWToken = (details) => {
  if (typeof details !== 'object'){
    details = {}
  }

  if (!details.maxAge || typeof details.maxAge !== 'number'){
    details.maxAge = 3600
  }

  details.sessionData = _.reduce(details.sessionData || {}, 
  	(memo, val, key) => {
		  if (typeof val !== "function" && key !== "password") {
		    memo[key] = val
		  }
	    return memo
  	}, 
  {})

  let token = jwt.sign({
     data: details.sessionData
    }, process.env.JWT_SECRET || _SECRET, {
      expiresIn: details.maxAge,
      algorithm: 'HS256'
  })

  return token
}

export const checkPermission = {
	/**
	 * Check permission for some query
	 * Not currently used
	 */
	 User: (ctx) => {
	 	return true;
	 }
}

export default (app) => {
	passport.use("local", new LocalStrategy(
  	async (username, password, next) => {
  		const user = await models.User.getUserByUsername(username);
  		if(!user){
  			// invalid username
  			return next(new Error(`invalid username or password`));
  		}
	    let validPassword = await user.comparePassword(password);
	    if(validPassword){
	      return next(null, user.getRecord());
	    } 
	    else {
	    	// invalid password
	      return next(new Error(`invalid username or password`));
	    }
	  }
	));

	app.use(passport.initialize());
	app.use(bodyParser.urlencoded({ extended: true }) );
	app.post('/login', (req, res, next) => {
		console.log('POST /login');
		passport.authenticate('local', {}, 
			(err, user, info) => {
				if(err) {
					res.status(401);
					res.send();
				}
				else {
					res.status(200)
	      		.json({
	        		success: true,
	        		token: createJWToken({
	            	sessionData: user,
	            	maxAge: 3600
	          	})
	      		})
      	}
		})(req, res, next);
	});

	app.use(
		ejwt({
			secret: (process.env.JWT_SECRET || _SECRET) 
		}), 
		(req,res,next) => {
			next();
	});

	app.get("/logout", isLoggedIn, (req, res) => {
		console.log('GET /logout');
		req.logout();
		res.json({loggedOut: true});
	});

}