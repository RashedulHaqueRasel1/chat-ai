import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'shared-chats.json');

async function getSharedChats(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveSharedChats(chats: Record<string, any>) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(chats, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save shared chats:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session } = body;

    if (!session || !session.id) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    const chats = await getSharedChats();
    chats[session.id] = {
      ...session,
      sharedAt: Date.now(),
    };
    await saveSharedChats(chats);

    return NextResponse.json({ success: true, id: session.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const chats = await getSharedChats();
    const chat = chats[id];

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json({ session: chat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
