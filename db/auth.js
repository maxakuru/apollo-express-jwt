import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import models from './models';
import bodyParser from 'body-parser';
import ejwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
const _SECRET = `woooooooooooooo`,
			_TOKEN_MAX_AGE = 3600,
			_REFRESH_MAX_AGE = 2592000,
			_REFRESH_REFRESH_THRESH = 24*_TOKEN_MAX_AGE; // within a day of expiring, dont't

/**
 * Create JWT token
 */
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

/**
 * check if token is expired
 * @param {string|object} token - decoded or encoded token
 */
export const expiredToken = (token) => {
	let dtoken = token;
	if(typeof token === 'string')
		dtoken = decodeToken(token);

	return false; 
}

/**
 * Clear a user's refreshToken stash
 */
export const clearRefreshTokens = (username) => {
}

/**
 * Decode token and return decoded response.
 * return false if token is not valid anymore.
 */
const decodeToken = (token) => {
	try{
		const decoded = jwt.verify(token, process.env.JWT_SECRET || _SECRET);
		return decoded;
	}
	catch(e) {
		return false;
	}
}

/**
 * Give back a new refreshToken if the given token is
 * valid and will be expiring soon (within 3 days)
 * Otherwise give back the same refreshToken
 */
export const getRefreshToken = (user, refreshToken) => {
	const decoded = decodeToken(refreshToken);
	console.log('getRefreshToken: ', decoded);
	if(decoded === false) {
		return false // already expired token
	}
	const now = new Date().getTime() / 1000;
	if((now - _REFRESH_REFRESH_THRESH) <= decoded.exp){
		// if it's within that small period of the end of the refresh token's life
		// make a new one, invalidate old one
		const newRefreshToken = createJWToken({
			sessionData: user.getRecordForJWT(), // cleaned record
			refreshToken: refreshToken,
			maxAge: _REFRESH_MAX_AGE
			// maxAge: 2592000
		});
		return newRefreshToken;
	}
	else {
		return refreshToken;
	}
}

/**
 * TODO: Add permission check functions for specific access rights
 */
export const checkPermission = {
	/**
	 * Check permission for some query
	 * Not currently used
	 */
	 User: (ctx) => {
	 	return true;
	 }
}

/**
 * Auth Middleware
 */
export default (app) => {

	passport.use("local", new LocalStrategy(
  	async (username, password, next) => {
  		const user = await models.User.getUserByUsername(username);
  		if(!user){
  			// invalid username
  			return next(new Error(`invalid username or password`));
  		}
	    if(password && await user.comparePassword(password)){
	      return next(null, user);
	    } 
	    else {
	    	// invalid password
	      return next(new Error(`invalid username or password`));
	    }
	  }
	));

	app.use(passport.initialize());
	// app.use(bodyParser.urlencoded({ extended: true }))
	app.post('/login', 
		bodyParser.json(), 
		(req, res, next) => {
			passport.authenticate('local', {}, 
				async (err, user, info) => {
					if(err || !user) {
						res.sendStatus(401);
					}
					else {
						// add a refresh token for this client
						let refreshToken = createJWToken({
							sessionData: user.getRecordForJWT(), // cleaned record
							refreshToken: refreshToken,
							maxAge: _REFRESH_MAX_AGE
							// maxAge: 2592000
		        });
						user.addRefreshToken(refreshToken);
						await user.save();
						res.json({
		        	success: true,
		        	token: createJWToken({
		            sessionData: user.getRecordForJWT(), // cleaned record
		            refreshToken: refreshToken,
		            // maxAge: 3600,
		            maxAge: _TOKEN_MAX_AGE
		          }),
		          refreshToken: refreshToken
		      	})
	      	}
			})(req, res, next);
		}
	);

  /**
   * Post here from client when token is expired to get a new one
   * Revoke client's refreshToken when logging out
   * Check that:
   * refreshToken is supplied by client
   * user.refreshTokens contains the supplied refreshToken
   * the refreshToken has a long life left, otherwise replace it
   * client must replace it's stashed token and refreshToken with the replied ones
   */
	app.post('/token', 
		bodyParser.json(), 
		async (req, res, next) => {
		  const refreshToken = req.body.refreshToken;
		  const decoded = decodeToken(refreshToken);
		  if(decoded){
		  	const user = await models.User.getUserByUsername(decoded.data.username);
			  if(user.refreshTokens && 
			  		refreshToken && 
			  		!expiredToken(refreshToken) && 
			  		user.refreshTokens.includes(refreshToken)) {
			  			let retRefreshToken = getRefreshToken(user, refreshToken);
			  			if(refreshToken !== retRefreshToken){
			  				// remove refreshToken from user and add new one
			  				user.removeRefreshToken(refreshToken);
			  				user.addRefreshToken(retRefreshToken);
			  				await user.save();
			  			}
			    		res.json({
		      			success: true,
		      			token: createJWToken({
		          		sessionData: user.getRecordForJWT(),
		          		refreshToken: retRefreshToken,
		          		maxAge: _TOKEN_MAX_AGE
		          		// maxAge: 3600
		        		}),
		        		refreshToken: retRefreshToken
		    			})
			  		}
			  		else {
			    		res.sendStatus(401)
			  		}
		  }
		  else {
			  res.sendStatus(401)
			}
		});

	/**
   * Post to register a new user
   * Check whether the user already exists, sanitize stuff
   */
	app.post('/register', 
		bodyParser.json(), 
		async (req, res, next) => {
	  	const username = req.body.username;
		  const user = await models.User.getUserByUsername(username);
		  // if(user.refreshTokens && refreshToken && Object.values(user.refreshTokens).includes(refreshToken)) {
		  //   res.status(200)
		  //     .json({
	   //    		success: true,
	   //    		token: createJWToken({
	   //        	sessionData: user.getRecord(),
	   //        	maxAge: 3600,
	   //        	refreshToken: refreshToken
	   //      	}),
	   //      	refreshToken: refreshToken
	   //  		})
		  // }
		  // else {
		  //   res.send(401)
		  // }
	});

	/**
	 * Revoke refreshToken and send back a false token.
	 */
	app.get("/logout", 
		async (req, res) => {
			// remove the user's refresh token from db
			// should only get here if there's a valid refreshToken in the headers
			// if there's a valid token, doesn't matter - it will expire
			// we want/NEED to invalidate the refreshToken on logout
			const refreshToken = req.headers.refreshToken;
			const username = req.headers.username;
			if(refreshToken && username){
				// check that username matches the refreshToken
				console.log('has headers: ', req.headers);
				const user = await models.User.getUserByUsername(username);
				// could check that this is the original requester via IP
				// but we'd rather invalid more tokens than let them be compromised
				if(user.refreshTokens && user.refreshTokens.includes(refreshTokens)){
					// remove that token
					for(let id in user.refreshTokens){
						if(user.refreshTokens[id] === refreshToken){
							delete user.refreshTokens[id];
							await user.save();
						}
					}
				}
			}
			// we don't care if they aren't authenticated
			// give them a success and false token back
			res.json({
    		success: true,
    		token: false
  		})
		}
	);

  /**
   * Check token validity.
   */
	app.use(
		ejwt({
			secret: (process.env.JWT_SECRET || _SECRET) 
		}), 
		(req,res,next) => {
			next();
		}
	);

}