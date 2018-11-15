import GraphQLDate from 'graphql-date';
import models from './models';
export const Resolvers = {
  Date: GraphQLDate,
  Query: {
    group(_, args, ctx) {
      return models.Group.find({ where: args });
    },
    messages(_, args, ctx) {
      return Message.findAll({
        where: args,
        order: [['createdAt', 'DESC']],
      });
    },
    user(_, args, ctx) {
      console.log('ctx.user: ', ctx.user.data.id, ' ==? ', args.id);
      if(ctx.user.data.id !== args.id)
        return null;
      return models.User.findOne(args);
    },
  },
  Group: {
    users(group) {
      return group.getUsers();
    },
    messages(group) {
      return models.Message.findAll({
        where: { groupId: group.id },
        order: [['createdAt', 'DESC']],
      });
    },
  },
  Message: {
    to(message) {
      return message.getTo();
    },
    from(message) {
      return message.getFrom();
    },
  },
  User: {
    messages(user) {
      return models.Message.find(
        { userId: user.id }).sort(
        [['createdAt', 'DESC']]);
    },
    groups(user) {
      console.log('user: ', user);
      return user.getGroups();
    },
    friends(user) {
      return user.getFriends();
    },
  },
};
export default Resolvers;