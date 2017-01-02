import * as express from 'express';
import * as graphQLHTTP from 'express-graphql';
import { GraphQLSchema } from 'graphql';
import { fetchSchema } from './schema';

const port = process.env.PORT || 3000;
const app = express();

app.use('/schemas/:schemaId/graphql', (req: express.Request, res: express.Response) => {
  fetchSchema(req.params.schemaId).then((schema) => {
    graphQLHTTP({schema: schema, graphiql: true})(req, res);
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port);
