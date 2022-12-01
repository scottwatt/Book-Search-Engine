const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
    Query: {
        users: async () => {
          return User.find({});
        },
        user: async (parent, { userId }) => {
            console.log('user called');
            return await User.findOne({ _id: userId });
        },
        me: async (parent, args, context) => {
          console.log('me called');
          if (context.user) {
            return await User.findOne({ _id: context.user._id });
          }
          throw new AuthenticationError('You need to be logged in! (me route)');
        },
      },
  Mutation: {
    addUser: async (parent, args) => {
      try {
        const user = await User.create(args);

        const token = signToken(user);
        return { token, user };
      } catch (err) {
        console.log(err);
      }
    },
    login: async (parent, { email, password }, context) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);
      return { token, user };
    },
    addBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args.input } },
          { new: true, runValidators: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in!");
    },
    removeBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: args.bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in!");
    },
  },
};

module.exports = resolvers;