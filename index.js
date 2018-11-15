import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { addMockFunctionsToSchema } from 'graphql-tools';
import { graphql } from 'graphql';
import db from './db';

db.connect();

const GRAPHQL_PORT = 13337;
const app = express();
// const executableSchema = makeExecutableSchema({
//   typeDefs: db.Schema,
//   resolvers: db.Resolvers
// });

// addMockFunctionsToSchema({
//   schema: executableSchema,
//   mocks: db.Mocks,
//   preserveResolvers: true,
// });
// `context` must be an object and can't be undefined when using connectors
db.auth(app, '/graphql');
// app.use('/graphql', bodyParser.json(), graphqlExpress({
//   schema: executableSchema,
//   context: {}, // at least(!) an empty object
// }));
// app.use('/graphiql', graphiqlExpress({
//   endpointURL: '/graphql',
// }));

// app.post('/graphql', (req, res) => {
//   graphql(executableSchema, req.body, { user: req.user })
//   .then((data) => {
//     res.send(JSON.stringify(data));
//   });
// });
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
// graphQLServer.listen(GRAPHQL_PORT, () => console.log(`GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`));