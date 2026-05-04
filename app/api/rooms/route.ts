import { NextRequest, NextResponse } from 'next/server';
import { storage, generateToken } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answererCount, realAnswerCount } = body;

    if (!answererCount || answererCount < 3 || answererCount > 12) {
      return NextResponse.json(
        { error: 'Answerer count must be between 3 and 12' },
        { status: 400 }
      );
    }

    if (!realAnswerCount || realAnswerCount < 1 || realAnswerCount >= answererCount) {
      return NextResponse.json(
        { error: 'Real answer count must be between 1 and answererCount-1' },
        { status: 400 }
      );
    }

    const hostToken = generateToken();
    const room = await storage.createRoom(hostToken, answererCount, realAnswerCount);

    return NextResponse.json({
      roomId: room.id,
      hostToken,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
