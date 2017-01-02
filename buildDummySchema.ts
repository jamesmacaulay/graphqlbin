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

function addResolvers(schema, type) {
  if (type.name.startsWith('__')) {
    return;
  }
  if (type instanceof GraphQLObjectType) {
    const fieldMap = type.getFields();
    Object.keys(fieldMap).forEach((fieldName) => {
      const field = fieldMap[fieldName];
      field.resolve = resolverForField(field);
    });
  } else if (isAbstractType(type)) {
    type.resolveType = () => schema.getPossibleTypes(type)[0];
  }
}

export function buildDummySchema(schemaString: string): GraphQLSchema {
  const schema = buildSchema(schemaString);
  const typeMap = schema.getTypeMap();
  Object.keys(typeMap).forEach((typeName) => {
    addResolvers(schema, typeMap[typeName]);
  });
  return schema;
}