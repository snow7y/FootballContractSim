export type NegotiationResult = 'Success' | 'Failure';

export type PlayerDialogueContext = {
  player: {
    id: number;
    name?: string | null;
    age: number;
    overall: number;
    potential: number;
  };
  result: NegotiationResult;
  offeredWage: number;
  expectedWage: number;
  wageRatio: number;
  contractYears: number;
  failureCount: number;
};

export type DialogueProvider = {
  generateDialogue: (context: PlayerDialogueContext) => Promise<string>;
};

type DialogueTone = 'youth' | 'veteran' | 'star' | 'standard';

type DialogueOptions = {
  provider?: DialogueProvider;
  aiEnabled?: boolean;
  rng?: () => number;
};

const SUCCESS_TEMPLATES: Record<DialogueTone, string[]> = {
  youth: ['すごく嬉しいです！一緒に頑張ります。', '期待に応えたいです。サインします！', 'このオファーなら全力で戦えそうです。'],
  veteran: ['悪くない条件だ。落ち着いて契約しよう。', '経験を評価してくれるなら話は早い。', 'この条件なら乗ってもいい。'],
  star: ['いいオファーだ。自分にふさわしい。', 'この待遇なら納得できる。サインしよう。', '期待通りだ。クラブのために結果を出す。'],
  standard: ['いい条件だね。契約しよう。', '十分な評価を感じる。サインするよ。', '納得できる。よろしく頼む。'],
};

const FAILURE_TEMPLATES: Record<DialogueTone, string[]> = {
  youth: ['もう少し評価してくれると嬉しいんだけどな。', 'まだ納得できないな…。', '条件を少し見直してくれる？'],
  veteran: ['この条件では動けない。', '経験を軽く見られている気がする。', 'もう少し現実的な話にしよう。'],
  star: ['この条件では話にならない。', '自分の価値を理解しているのか？', 'もっと相応しいオファーが必要だ。'],
  standard: ['この条件だと厳しいな。', 'もう少し考えてくれる？', '今の条件では決断できない。'],
};

const HARSH_FAILURE_TEMPLATES: Record<DialogueTone, string[]> = {
  youth: ['何度も同じ話をするのは時間の無駄かもしれない…。', 'さすがにこれ以上は厳しいです。'],
  veteran: ['何度も同じ話をするのは時間の無駄だと思うんだが。', 'これ以上は話が進まない。'],
  star: ['何度も同じ話をする価値はない。', 'これ以上は付き合えない。'],
  standard: ['何度も同じ話をするのは疲れるな。', 'これ以上は難しい。'],
};

function resolveTone(context: PlayerDialogueContext): DialogueTone {
  if (context.player.age <= 22) return 'youth';
  if (context.player.age >= 30) return 'veteran';
  if (context.player.overall >= 85 || context.player.potential >= 88) return 'star';
  return 'standard';
}

function pickRandom(choices: string[], rng: () => number) {
  if (choices.length === 0) return '';
  const index = Math.min(Math.floor(rng() * choices.length), choices.length - 1);
  return choices[index];
}

function generateRuleBasedDialogue(context: PlayerDialogueContext, rng: () => number): string {
  const tone = resolveTone(context);
  if (context.result === 'Success') {
    return pickRandom(SUCCESS_TEMPLATES[tone], rng);
  }

  const templates = context.failureCount >= 3 ? HARSH_FAILURE_TEMPLATES[tone] : FAILURE_TEMPLATES[tone];
  return pickRandom(templates, rng);
}

export async function generatePlayerDialogue(
  context: PlayerDialogueContext,
  options: DialogueOptions = {}
): Promise<string> {
  const rng = options.rng ?? Math.random;
  if (options.aiEnabled && options.provider) {
    try {
      const message = await options.provider.generateDialogue(context);
      if (message && message.trim().length > 0) {
        return message.trim();
      }
    } catch (error) {
      console.warn('AI dialogue generation failed, falling back to rule-based.', error);
    }
  }

  return generateRuleBasedDialogue(context, rng);
}
