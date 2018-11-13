import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { addMockFunctionsToSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import db from './db';

db.connect();

const GRAPHQL_PORT = 9999;
const app = express();

// addMockFunctionsToSchema({
//   schema: executableSchema,
//   mocks: db.Mocks,
//   preserveResolvers: true,
// });
db.auth(app, '/graphql');

const contextFn = (req, res) => {
	return {
		'user': req.req.user
	}
}

// const graphQLServer = createServer(app);
const typeDefs = db.Schema;
const resolvers = db.Resolvers;
const server = new ApolloServer({ 
	typeDefs, 
	resolvers,
	playground: {
		endpoint: '/graphql'
	},
	context: contextFn
});

server.applyMiddleware({ app });

app.listen({port: GRAPHQL_PORT}, () => {
	console.log(`GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`);
});
