import mongoose from 'mongoose';
import { db } from './constants';
import models from './models';
import { _ } from 'lodash';

export default () => {
  // Find the appropriate database to connect to, default to localhost if not found.
  const connect = () => {
    mongoose.Promise = require('bluebird');
    mongoose.connect(db, {
      useMongoClient: true
    }, (err) => {
      if (err) {
        console.log(`===>  Error connecting to ${db}`);
        console.log(`Reason: ${err}`);
      } else {
        console.log(`===>  Succeeded in connecting to ${db}`);
      }
    });
    try {
      models.Group.seed(10, true, (e) => {
        if(e) console.log('error seeding: ', e);
      });
      models.Message.seed(10, true, (e) => {
        if(e) console.log('error seeding: ', e);
      });
      models.User.seed(10, true, (e) => {
        if(e) console.log('error seeding: ', e);
      });
    }
    catch(e) {
      console.log('[db/connect.js] ERROR: ', e);
    }
  };
  connect();

  mongoose.connection.on('error', console.log);
  mongoose.connection.on('disconnected', connect);

  const handleSeedErr = (e) => {
    console.log('error seeding: ', e);
  }
};