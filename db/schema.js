// import { gql } from 'apollo-server-express';

export const Schema = [`
  # declare custom scalars
  scalar Date
  # A match between users
  type Match {
    id: Int! # unique id for the match
    name: String # name of the match
    users: [User] # users in the match
  }
  # a group chat entity
  type Group {
    id: Int! # unique id for the group
    name: String # name of the group
    users: [User] # users in the group
    messages: [Message] # messages sent to the group
    match: Match #match tied to the group
  }
  type User {
    id: Int! # unique id for the user
    email: String! # we will also require a unique email per user
    username: String # this is the name we'll show other users
    messages: [Message] # messages sent by user
    groups: [Group] # groups the user belongs to
    friends: [User] # user's friends/contacts
  }
  type Score {
    id: Int! # unique id for score
    messages: [Message] # messages sent by user
    groups: [Group] # groups the user belongs to
    users: [User] # users score relates to
  }
  # a message sent from a user to a group
  type Message {
    id: Int! # unique id for message
    to: Group! # group message was sent in
    from: User! # user who sent the message
    text: String! # message text
    createdAt: Date! # when message was created
  }

  # query for types
  type Query {
    # Return a user by their email or id
    user(email: String, id: Int, _id: String): User
    # Return messages sent by a user via userId
    # Return messages sent to a group via groupId
    messages(groupId: Int, userId: Int): [Message]
    # Return a group by its id
    group(id: Int!): Group
  }
  schema {
    query: Query
  }
`];
export default Schema;