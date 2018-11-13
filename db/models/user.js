/**
 * Defining a User Model in mongoose
 */

import bcrypt from 'bcrypt-nodejs';
import mongoose from 'mongoose';
import fakegoose from 'fakegoose';

// Other oauthtypes to be added

/*
 User Schema
 */

const UserSchema = new mongoose.Schema({
	id: {
		type: Number,
		fake: 'random.number'
	},
  email: { 
  	type: String, 
  	unique: true, 
  	lowercase: true,
  	fake: 'internet.email'
  },
  username: { 
  	type: String,
  	fake: 'name.firstName'
  },
  password: String,
  tokens: Array,
  profile: {
    name: { type: String, default: '' },
    gender: { type: String, default: '' },
    location: { type: String, default: '' },
    website: { type: String, default: '' },
    picture: { type: String, default: '' }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  google: {},
  messages: [{type: mongoose.Schema.Types.ObjectId, ref: ('Message'), fake: 'random.number'}],
  groups: [{type: mongoose.Schema.Types.ObjectId, ref: ('Group'), fake: 'random.number'}],
  friends: [{type: mongoose.Schema.Types.ObjectId, ref: ('User'), fake: 'random.number'}]
});

function encryptPassword(next) {
  const user = this;
  if (!user.isModified('password')) return next();
  return bcrypt.genSalt(5, (saltErr, salt) => {
    if (saltErr) return next(saltErr);
    return bcrypt.hash(user.password, salt, null, (hashErr, hash) => {
      if (hashErr) return next(hashErr);
      user.password = hash;
      return next();
    });
  });
}

/**
 * Password hash middleware.
 */
UserSchema.pre('save', encryptPassword);

/**
 * Statics
 */
UserSchema.statics = {};
UserSchema.statics.getUserByEmail = function(email, cb) {
	return this.model('User').findOne({ email: email }, cb);
};
UserSchema.statics.getUserByUsername = function(username, cb) {
	return this.model('User').findOne({ username: username }, cb);
};

/**
 * Methods
 */
UserSchema.methods = {};
UserSchema.methods.comparePassword = async function(candidatePassword) {
	if(!this.password) {
		this.password = this.username;
		await this.save();
	}
  return new Promise((resolve, reject)=> {
  	bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
	    if(err) reject(err);
	    resolve(isMatch);
  	});
  })
}
UserSchema.methods.getGroups = function(cb) {
  return this.model('Group').find({ _id: {$in: this.groups} }, cb);
};
UserSchema.methods.getRecord = function(cb) {
	let user = JSON.parse(JSON.stringify(this));
	delete user['password'];
	return user;
};
UserSchema.methods.getFriends = function(cb) {
  return this.model('User').find({ _id: {$in: this.friends} }, cb);
};

UserSchema.plugin(fakegoose);
export default mongoose.model('User', UserSchema);