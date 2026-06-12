import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import { resolvers } from "./resolvers";
import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";

const typeDefs = gql(readFileSync(join(process.cwd(), "schema.graphql"), "utf8"));

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest, any>(server, {
  context: async (req: NextRequest) => {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : "";
    return { idToken };
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
