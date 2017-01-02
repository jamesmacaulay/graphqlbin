import * as express from 'express';
import * as graphQLHTTP from 'express-graphql';
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';

const app = express();

function fetchSchema(schemaId) {
  return Promise.resolve(new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'QueryRoot',
      fields: {
        schemaId: {
          type: GraphQLString,
          resolve() {
            return schemaId;
          }
        }
      }
    })
  }));
}

app.use('/schemas/:schemaId/graphql', (req: express.Request, res: express.Response) => {
  fetchSchema(req.params.schemaId).then((schema: GraphQLSchema) => {
    graphQLHTTP({schema: schema, graphiql: true})(req, res);
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
