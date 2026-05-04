import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { hostToken, action } = body;

    if (!await storage.isHost(params.id, hostToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (action === 'end_game') {
      const room = await storage.endGame(params.id);
      return NextResponse.json({ success: true, room });
    }

    if (action === 'reset_game') {
      const room = await storage.resetGame(params.id);
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}
