import {
  graphql,
  buildSchema,
  isCompositeType,
  getNamedType,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLOutputType,
  GraphQLField,
  GraphQLList
} from 'graphql';

const dummySchema = buildSchema(`
type User {
  name: String
  emails: [String]
  admin: Boolean
  trustScore: Float
}
type Query {
  schemaId: ID
  currentUser: User
  users: [User]
  userCount: Int
}
schema {
  query: Query
}
`);

const typeMap = dummySchema.getTypeMap();

const scalarGenerators = {
  Int: () => 0,
  Float: () => 0.0,
  String: () => 'string',
  Boolean: () => false,
  ID: () => 'id'
}

function customScalarGenerator(type) {
  return type.name;
}

function arbitraryScalar(type: GraphQLScalarType) {
  return (scalarGenerators[type.name] || customScalarGenerator(type))();
}

function arbitraryList(type: GraphQLList<GraphQLOutputType>) {
  return [generatorForType(type.ofType)()];
}

function generatorForType(type: GraphQLOutputType) {
  if (type instanceof GraphQLScalarType) {
    return () => arbitraryScalar(type);
  } else if (type instanceof GraphQLObjectType) {
    return () => ({});
  } else if (type instanceof GraphQLList) {
    return () => arbitraryList(type);
  }
}

function resolverForField<TSource, TContext>(field: GraphQLField<TSource, TContext>) {
  return generatorForType(field.type);
}

Object.keys(typeMap).forEach((typeName) => {
  if (!typeName.startsWith('__')) {
    const type = typeMap[typeName];
    if (type instanceof GraphQLObjectType) {
      const fieldMap = typeMap[typeName].getFields();
      Object.keys(fieldMap).forEach((fieldName) => {
        const field = fieldMap[fieldName];
        field.resolve = resolverForField(field);
      });
    }
  }
});

export function fetchSchema(schemaId: String) {
  return Promise.resolve(dummySchema);
}
