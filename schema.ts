import {
  graphql,
  buildSchema,
  isCompositeType,
  isAbstractType,
  getNamedType,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLOutputType,
  GraphQLField,
  GraphQLList
} from 'graphql';

const dummySchema = buildSchema(`
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
`);

const typeMap = dummySchema.getTypeMap();

const scalarGenerators = {
  Int: () => 1,
  Float: () => 0.5,
  String: () => 'string',
  Boolean: () => true,
  ID: () => 'id'
}

function customScalarGenerator(type) {
  return type.name;
}

function arbitraryScalar(type: GraphQLScalarType) {
  return (scalarGenerators[type.name] || customScalarGenerator(type))();
}

function arbitraryEnum(type: GraphQLEnumType) {
  return type.getValues()[0].value;
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
  } else if (type instanceof GraphQLEnumType) {
    return () => arbitraryEnum(type);
  } else {
    return () => ({});
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
    } else if (isAbstractType(type)) {
      type.resolveType = () => dummySchema.getPossibleTypes(type)[0];
    }
  }
});

export function fetchSchema(schemaId: String) {
  return Promise.resolve(dummySchema);
}
