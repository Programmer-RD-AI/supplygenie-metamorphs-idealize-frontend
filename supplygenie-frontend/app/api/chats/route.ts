import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("supplygenie");
    const chats = await db.collection("chats").find({}).toArray();
    return NextResponse.json({ chats });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
} 