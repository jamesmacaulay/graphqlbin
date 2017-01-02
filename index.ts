import * as express from 'express';
import * as graphQLHTTP from 'express-graphql';
import { urlencoded } from 'body-parser';
import { GraphQLSchema, buildSchema, printSchema } from 'graphql';
import { InMemoryBlobStore } from './InMemoryBlobStore';
import { buildDummySchema } from './buildDummySchema';

const blobStore = new InMemoryBlobStore();
const port = process.env.PORT || 3000;
const app = express();

app.use(express.static('public'));

app.all('/schemas/:schemaId/graphql', (req: express.Request, res: express.Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    blobStore.fetch(req.params.schemaId).then((blob) => {
      if (blob) {
        const schema = buildDummySchema(blob);
        graphQLHTTP({schema: schema, graphiql: true})(req, res);
      } else {
        res.send(404);
      }
    });
  }
});

app.use('/schemas', urlencoded({extended: true}));
app.post('/schemas', (req, res) => {
  const blob = req.body.schema;
  const schema = buildSchema(blob);
  const normalizedSchema = printSchema(schema);
  blobStore.add(normalizedSchema).then((digest) => {
    res.redirect(`/schemas/${digest}/graphql`);
  });
});

app.listen(port);
