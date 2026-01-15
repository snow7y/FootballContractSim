'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const USER_COOKIE_KEY = 'fcs-user-id';

export type UserContextError =
  | { type: 'NotSelected'; message: string }
  | { type: 'System'; message: string };

export type UserContextResult =
  | { ok: true; userId: number; displayName: string }
  | { ok: false; error: UserContextError };

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  });
}

function readUserIdCookie(): number | null {
  const cookieStore = cookies();
  const raw = cookieStore.get(USER_COOKIE_KEY)?.value;
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function getCurrentUser(): Promise<UserContextResult> {
  try {
    const userId = readUserIdCookie();
    if (!userId) {
      return { ok: false, error: { type: 'NotSelected', message: 'ユーザーが選択されていません。' } };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { ok: false, error: { type: 'NotSelected', message: 'ユーザーが見つかりません。' } };
    }

    return { ok: true, userId: user.id, displayName: user.name };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: 'ユーザー取得に失敗しました。' } };
  }
}

export async function setCurrentUser(input: { userId: number }): Promise<UserContextResult> {
  try {
    if (!Number.isInteger(input.userId) || input.userId <= 0) {
      return { ok: false, error: { type: 'NotSelected', message: 'ユーザーが選択されていません。' } };
    }

    const user = await prisma.user.findUnique({ where: { id: input.userId } });
    if (!user) {
      return { ok: false, error: { type: 'NotSelected', message: 'ユーザーが見つかりません。' } };
    }

    const cookieStore = cookies();
    cookieStore.set(USER_COOKIE_KEY, String(user.id), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return { ok: true, userId: user.id, displayName: user.name };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: 'ユーザー設定に失敗しました。' } };
  }
}

export async function createUser(input: { name: string }): Promise<UserContextResult> {
  try {
    const name = input.name?.trim();
    if (!name) {
      return { ok: false, error: { type: 'NotSelected', message: 'ユーザー名を入力してください。' } };
    }

    const user = await prisma.user.create({ data: { name } });

    const cookieStore = cookies();
    cookieStore.set(USER_COOKIE_KEY, String(user.id), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });

    return { ok: true, userId: user.id, displayName: user.name };
  } catch (error) {
    console.error(error);
    return { ok: false, error: { type: 'System', message: 'ユーザー作成に失敗しました。' } };
  }
}
