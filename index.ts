import * as express from 'express';
import * as graphQLHTTP from 'express-graphql';
import { GraphQLSchema } from 'graphql';
import { InMemoryBlobStore } from './InMemoryBlobStore';
import { buildDummySchema } from './buildDummySchema';

const blobStore = new InMemoryBlobStore();
blobStore.add(`
type User {
  name: String
  emails: [String]
  pets: [Pet]
  admin: Boolean
  type: UserType
  trustScore: Float
}
type Query {
  schemaId: ID
  currentUser: User
  users: [User]
  userCount: Int
}
enum UserType {
  ADMIN
  MODERATOR
  MEMBER
}
interface Pet {
  name: String
}
type Cat implements Pet {
  name: String
  currentlyPurring: Boolean
}
type Dog implements Pet {
  name: String
  currentlyFetching: Boolean
}
schema {
  query: Query
}
`).then((digest) => {
  console.log(digest);
});

const port = process.env.PORT || 3000;
const app = express();

app.use('/schemas/:schemaId/graphql', (req: express.Request, res: express.Response) => {
  blobStore.fetch(req.params.schemaId).then((blob) => {
    if (blob) {
      const schema = buildDummySchema(blob);
      graphQLHTTP({schema: schema, graphiql: true})(req, res);
    } else {
      res.sendStatus(404);
    }
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port);
