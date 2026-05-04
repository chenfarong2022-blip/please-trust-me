import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getRandomQuestion } from '@/lib/questions';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { hostToken, useRandom, customQuestions } = body;

    if (!await storage.isHost(params.id, hostToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const room = await storage.getRoom(params.id);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    if (room.answerers.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 answerers to deal cards' },
        { status: 400 }
      );
    }

    let realAnswers: string[] = [];
    let realAnswersPinyin: string[] = [];

    if (useRandom) {
      const shuffledIndices = [...Array(room.answerers.length).keys()];
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      }
      const selectedIndices = shuffledIndices.slice(0, room.realAnswerCount);

      for (let i = 0; i < room.realAnswerCount; i++) {
        const q = getRandomQuestion();
        realAnswers.push(q.question);
        realAnswersPinyin.push(q.pinyin);
      }

      const updatedRoom = await storage.dealCards(
        params.id,
        realAnswers,
        realAnswersPinyin,
        selectedIndices
      );

      return NextResponse.json({
        success: true,
        realAnswers: updatedRoom?.realAnswers,
        realAnswersPinyin: updatedRoom?.realAnswersPinyin,
        answerers: updatedRoom?.answerers.map(a => ({
          id: a.id,
          token: a.token,
          number: a.number,
          nickname: a.nickname,
          hasRealAnswer: a.hasRealAnswer,
          answer: a.answer,
          pinyin: a.pinyin,
        })),
      });
    } else {
      if (!customQuestions || customQuestions.length !== room.realAnswerCount) {
        return NextResponse.json(
          { error: `Need exactly ${room.realAnswerCount} custom questions` },
          { status: 400 }
        );
      }

      const emptyCount = customQuestions.filter((q: string) => !q.trim()).length;
      if (emptyCount > 0) {
        return NextResponse.json(
          { error: 'All custom questions must be filled' },
          { status: 400 }
        );
      }

      realAnswers = customQuestions.map((q: string) => q.trim());
      realAnswersPinyin = realAnswers.map(() => '');

      const shuffledIndices = [...Array(room.answerers.length).keys()];
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      }
      const selectedIndices = shuffledIndices.slice(0, room.realAnswerCount);

      const updatedRoom = await storage.dealCards(
        params.id,
        realAnswers,
        realAnswersPinyin,
        selectedIndices
      );

      return NextResponse.json({
        success: true,
        realAnswers: updatedRoom?.realAnswers,
        realAnswersPinyin: updatedRoom?.realAnswersPinyin,
        answerers: updatedRoom?.answerers.map(a => ({
          id: a.id,
          token: a.token,
          number: a.number,
          nickname: a.nickname,
          hasRealAnswer: a.hasRealAnswer,
          answer: a.answer,
          pinyin: a.pinyin,
        })),
      });
    }
  } catch (error) {
    console.error('Error dealing cards:', error);
    return NextResponse.json(
      { error: 'Failed to deal cards' },
      { status: 500 }
    );
  }
}
