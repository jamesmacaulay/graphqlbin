"use strict";
const graphql_1 = require("graphql");
const dummySchema = graphql_1.buildSchema(`
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
};
function customScalarGenerator(type) {
    return type.name;
}
function arbitraryScalar(type) {
    return (scalarGenerators[type.name] || customScalarGenerator(type))();
}
function arbitraryList(type) {
    return [generatorForType(type.ofType)()];
}
function generatorForType(type) {
    if (type instanceof graphql_1.GraphQLScalarType) {
        return () => arbitraryScalar(type);
    }
    else if (type instanceof graphql_1.GraphQLObjectType) {
        return () => ({});
    }
    else if (type instanceof graphql_1.GraphQLList) {
        return () => arbitraryList(type);
    }
}
function resolverForField(field) {
    return generatorForType(field.type);
}
Object.keys(typeMap).forEach((typeName) => {
    if (!typeName.startsWith('__')) {
        const type = typeMap[typeName];
        if (type instanceof graphql_1.GraphQLObjectType) {
            const fieldMap = typeMap[typeName].getFields();
            Object.keys(fieldMap).forEach((fieldName) => {
                const field = fieldMap[fieldName];
                field.resolve = resolverForField(field);
            });
        }
    }
});
function fetchSchema(schemaId) {
    return Promise.resolve(dummySchema);
}
exports.fetchSchema = fetchSchema;
