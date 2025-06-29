import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise: Promise<MongoClient> | null = null;

async function connect(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI not set");
  }
  const client = new MongoClient(uri, options);
  await client.connect();
  return client;
}

export default function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = connect();
  }
  return clientPromise;
}
