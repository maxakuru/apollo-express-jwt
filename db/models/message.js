/**
 * Schema Definitions
 *
 */
import mongoose from 'mongoose';
import fakegoose from 'fakegoose';

const MessageSchema = new mongoose.Schema({
  id: {
  	type: Number,
  	fake: 'random.number'
  },
  text: {
  	type: String,
  	fake: 'lorem.sentence'
  },
  createdAt: {
  	type: Date,
  	fake: 'date.past'
  },
  to: {type: mongoose.Schema.Types.ObjectId, ref: ('Group'), fake: 'random.number'},
  from: {type: mongoose.Schema.Types.ObjectId, ref: ('User'), fake: 'random.number'}
});

/**
 * Methods
 */
MessageSchema.methods.getTo = function(cb) {
  return this.model('Group').find({ _id: this.to }, cb);
};
MessageSchema.methods.getFrom = function(cb) {
  return this.model('User').find({ _id: this.from }, cb);
};

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Message' collection in the MongoDB database
MessageSchema.plugin(fakegoose);
export default mongoose.model('Message', MessageSchema);