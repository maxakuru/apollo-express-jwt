/**
 * Schema Definitions
 *
 */
import mongoose from 'mongoose';
import fakegoose from 'fakegoose';

const GroupSchema = new mongoose.Schema({
  id: {
  	type: Number,
  	fake: 'random.number'
  },
  name: { 
  	type: String,
  	fake: 'lorem.word'
  },
  users: [{type: mongoose.Schema.Types.ObjectId, ref: ('User'), fake: 'random.number'}],
  messages: [{type: mongoose.Schema.Types.ObjectId, ref: ('Message'), fake: 'random.number'}]
});

/**
 * Methods
 */
GroupSchema.methods.getUsers = function(cb) {
  return this.model('User').find({ _id: {$in: this.users} }, cb);
};
GroupSchema.methods.getMessages = function(cb) {
  return this.model('Message').find({ _id: {$in: this.messages} }, cb);
};

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Group' collection in the MongoDB database
GroupSchema.plugin(fakegoose);
export default mongoose.model('Group', GroupSchema);