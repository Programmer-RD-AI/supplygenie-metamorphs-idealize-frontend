import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    // Hardcoded user_id for debugging
    const user_id = "Fdb7pmhFLkc2krpayhf30LF46nS2";
    const client = await clientPromise;
    const db = client.db("userchats");
    const userDoc = await db.collection("chats").findOne({ user_id });
    if (!userDoc) return NextResponse.json({ chats: [] });
    return NextResponse.json({ chats: userDoc.chat_history || [] });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_id, message } = body;
    if (!user_id || !chat_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('userchats');
    // Find the user document and the correct chat in chat_history
    const result = await db.collection('chats').findOneAndUpdate(
      { user_id, 'chat_history.chat_id': chat_id },
      { $push: { 'chat_history.$.messages': message } },
      { returnDocument: 'after' }
    );
    if (!result.value) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    // Return the updated chat
    const updatedChat = result.value.chat_history.find((c: any) => c.chat_id === chat_id);
    return NextResponse.json({ chat: updatedChat });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_name } = body;
    if (!user_id || !chat_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('userchats');
    const newChat = {
      chat_id: `chat_${Date.now()}`,
      chat_name,
      messages: [],
    };
    // Try to add to existing user document
    const result = await db.collection('chats').findOneAndUpdate(
      { user_id },
      { $push: { chat_history: newChat } },
      { upsert: true, returnDocument: 'after' }
    );
    return NextResponse.json({ chat: newChat });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_id, new_chat_name } = body;
    if (!user_id || !chat_id || !new_chat_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db('userchats');
    // Update the chat_name for the correct chat in chat_history
    const result = await db.collection('chats').findOneAndUpdate(
      { user_id, 'chat_history.chat_id': chat_id },
      { $set: { 'chat_history.$.chat_name': new_chat_name } },
      { returnDocument: 'after' }
    );
    if (!result.value) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const updatedChat = result.value.chat_history.find((c: any) => c.chat_id === chat_id);
    return NextResponse.json({ chat: updatedChat });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update chat name' }, { status: 500 });
  }
} 