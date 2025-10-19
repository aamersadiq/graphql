import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0",
          import: ["@key", "@shareable", "@provides", "@external"])

  scalar DateTime

  type User @key(fields: "id") {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    fullName: String
    createdAt: DateTime!
    updatedAt: DateTime!
    addresses: [Address!]!
    roles: [Role!]!
  }

  type Address {
    id: ID!
    user: User!
    type: AddressType!
    street: String!
    city: String!
    state: String!
    postalCode: String!
    country: String!
    isDefault: Boolean!
  }

  enum AddressType {
    BILLING
    SHIPPING
  }

  type Role {
    id: ID!
    name: String!
    permissions: [Permission!]!
  }

  type Permission {
    id: ID!
    name: String!
    description: String
  }

  type Query {
    me: User
    user(id: ID!): User
    users: [User!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    updateUser(input: UpdateUserInput!): User!
    addAddress(input: AddAddressInput!): Address!
    updateAddress(id: ID!, input: UpdateAddressInput!): Address!
    deleteAddress(id: ID!): Boolean!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    email: String
  }

  input AddAddressInput {
    type: AddressType!
    street: String!
    city: String!
    state: String!
    postalCode: String!
    country: String!
    isDefault: Boolean!
  }

  input UpdateAddressInput {
    type: AddressType
    street: String
    city: String
    state: String
    postalCode: String
    country: String
    isDefault: Boolean
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;