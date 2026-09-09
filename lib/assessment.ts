export type Axis = 'anxiety' | 'avoidance' | 'secure';
export type Domain = 'closeness' | 'trust' | 'needs' | 'communication' | 'conflict' | 'boundaries' | 'regulation' | 'repair';
export type ProfileKey = 'secure' | 'anxious' | 'dismissive' | 'fearful';

export type Question = {
  id: number;
  text: string;
  axis: Axis;
  domain: Domain;
  reverse?: boolean;
};

export const questions: Question[] = [
  { id: 1, text: 'I notice small changes in closeness and wonder whether something is wrong.', axis: 'anxiety', domain: 'closeness' },
  { id: 2, text: 'I can ask for reassurance without feeling ashamed of needing it.', axis: 'secure', domain: 'needs' },
  { id: 3, text: 'When someone wants emotional closeness, part of me wants more distance.', axis: 'avoidance', domain: 'closeness' },
  { id: 4, text: 'During conflict, I worry that the relationship may be ending.', axis: 'anxiety', domain: 'conflict' },
  { id: 5, text: 'I am comfortable depending on people I trust when I genuinely need support.', axis: 'avoidance', domain: 'trust', reverse: true },
  { id: 6, text: 'I can stay connected to my own needs while also considering someone else’s.', axis: 'secure', domain: 'boundaries' },
  { id: 7, text: 'If a message goes unanswered, my mind quickly fills in painful explanations.', axis: 'anxiety', domain: 'trust' },
  { id: 8, text: 'I prefer to handle difficult feelings alone rather than let someone see them.', axis: 'avoidance', domain: 'communication' },
  { id: 9, text: 'After a disagreement, I can calm myself before deciding what it means.', axis: 'secure', domain: 'regulation' },
  { id: 10, text: 'I need frequent signs that I still matter to the people I love.', axis: 'anxiety', domain: 'needs' },
  { id: 11, text: 'I feel uneasy when a relationship begins to require more vulnerability from me.', axis: 'avoidance', domain: 'closeness' },
  { id: 12, text: 'I can express disappointment directly without attacking or disappearing.', axis: 'secure', domain: 'communication' },
  { id: 13, text: 'I replay conversations to look for signs that I have been rejected.', axis: 'anxiety', domain: 'communication' },
  { id: 14, text: 'Keeping my independence feels safer than relying deeply on another person.', axis: 'avoidance', domain: 'trust' },
  { id: 15, text: 'I can hear “not right now” without automatically hearing “not ever.”', axis: 'anxiety', domain: 'boundaries', reverse: true },
  { id: 16, text: 'When emotions become intense, I tend to shut down or go numb.', axis: 'avoidance', domain: 'regulation' },
  { id: 17, text: 'I can set a boundary and remain warm and connected.', axis: 'secure', domain: 'boundaries' },
  { id: 18, text: 'I sometimes say yes, over-explain, or over-give because I fear losing connection.', axis: 'anxiety', domain: 'boundaries' },
  { id: 19, text: 'I become irritated when someone expects me to talk about feelings before I am ready.', axis: 'avoidance', domain: 'communication' },
  { id: 20, text: 'I trust that healthy conflict can lead to understanding rather than abandonment.', axis: 'secure', domain: 'conflict' },
  { id: 21, text: 'I feel responsible for restoring closeness as quickly as possible after tension.', axis: 'anxiety', domain: 'repair' },
  { id: 22, text: 'I minimize my needs because needing less feels more secure.', axis: 'avoidance', domain: 'needs' },
  { id: 23, text: 'I can receive care without immediately questioning it or pulling away.', axis: 'avoidance', domain: 'trust', reverse: true },
  { id: 24, text: 'Even in a stable relationship, I sometimes expect to be left or replaced.', axis: 'anxiety', domain: 'trust' },
  { id: 25, text: 'When I am hurt, distance feels more manageable than working through it together.', axis: 'avoidance', domain: 'repair' },
  { id: 26, text: 'I can name what I feel and make a clear request.', axis: 'secure', domain: 'needs' },
  { id: 27, text: 'I become preoccupied with where I stand when someone seems less available.', axis: 'anxiety', domain: 'closeness' },
  { id: 28, text: 'I find it difficult to stay present when someone is upset with me.', axis: 'avoidance', domain: 'conflict' },
  { id: 29, text: 'I can take space during conflict and clearly communicate when I will return.', axis: 'secure', domain: 'repair' },
  { id: 30, text: 'Strong emotions can make me act before I have had time to understand what I need.', axis: 'anxiety', domain: 'regulation' },
  { id: 31, text: 'People close to me sometimes experience me as emotionally hard to reach.', axis: 'avoidance', domain: 'communication' },
  { id: 32, text: 'I can let closeness develop gradually without chasing it or resisting it.', axis: 'anxiety', domain: 'closeness', reverse: true },
];

export const profiles: Record<ProfileKey, {
  name: string;
  shortName: string;
  essence: string;
  strengths: string[];
  needs: string[];
  triggers: string[];
  growth: string[];
}> = {
  secure: {
    name: 'Secure Attachment', shortName: 'Secure',
    essence: 'You tend to experience closeness and independence as compatible. You can usually communicate needs, tolerate ordinary relationship uncertainty, and return to connection after conflict.',
    strengths: ['Emotional steadiness', 'Direct communication', 'Respect for mutual boundaries', 'Capacity for repair'],
    needs: ['Consistency', 'Reciprocity', 'Honest communication', 'Room for both closeness and autonomy'],
    triggers: ['Prolonged dishonesty', 'Repeated boundary violations', 'Relationships that resist mutual repair'],
    growth: ['Keep naming needs before resentment builds', 'Avoid taking responsibility for all of the emotional steadiness', 'Stay curious when another person’s pattern differs from yours'],
  },
  anxious: {
    name: 'Anxious Preoccupied Attachment', shortName: 'Anxious Preoccupied',
    essence: 'Connection matters deeply to you, and your attachment system may become highly alert to distance, inconsistency, or uncertainty. You may seek quick reassurance when closeness feels threatened.',
    strengths: ['Emotional attunement', 'Warmth and loyalty', 'Willingness to engage', 'Sensitivity to relationship shifts'],
    needs: ['Consistency', 'Clear reassurance', 'Emotional responsiveness', 'Reliable follow-through'],
    triggers: ['Silence or delayed responses', 'Ambiguous commitment', 'Sudden changes in warmth', 'Feeling excluded or deprioritized'],
    growth: ['Pause before treating uncertainty as proof', 'Ask directly instead of testing connection', 'Build self-soothing alongside healthy reassurance', 'Practice boundaries that protect your own energy'],
  },
  dismissive: {
    name: 'Dismissive Avoidant Attachment', shortName: 'Dismissive Avoidant',
    essence: 'Self-reliance may feel safer than emotional dependence. When closeness or conflict becomes intense, you may protect yourself by minimizing needs, becoming highly practical, or creating distance.',
    strengths: ['Independence', 'Composure under pressure', 'Practical problem-solving', 'Respect for autonomy'],
    needs: ['Time to process', 'Respectful directness', 'Choice and personal space', 'Low-pressure invitations to connect'],
    triggers: ['Feeling controlled', 'Emotional urgency', 'Repeated demands for immediate disclosure', 'Fear of losing autonomy'],
    growth: ['Name the need for space without disappearing', 'Practice sharing one layer more than feels automatic', 'Notice when self-reliance becomes isolation', 'Return to repair at a specific time'],
  },
  fearful: {
    name: 'Fearful Avoidant Attachment', shortName: 'Fearful Avoidant',
    essence: 'You may deeply want closeness while also experiencing it as risky. Your system can move between reaching for connection and protecting itself through distance, especially when trust or safety feels uncertain.',
    strengths: ['Depth and sensitivity', 'Strong perception of interpersonal dynamics', 'Capacity for empathy', 'Courage developed through complexity'],
    needs: ['Emotional safety', 'Predictability', 'Patient trust-building', 'Clear and respectful boundaries'],
    triggers: ['Mixed signals', 'Feeling trapped or abandoned', 'Sudden emotional intensity', 'Betrayal or perceived loss of control'],
    growth: ['Slow the reach-withdraw cycle', 'Separate present cues from earlier danger', 'Use small, consistent acts of trust', 'Ask for paced connection instead of choosing all-or-nothing'],
  },
};

export type AssessmentScores = {
  anxiety: number;
  avoidance: number;
  secureCapacity: number;
  alignments: Record<ProfileKey, number>;
  ranked: ProfileKey[];
  primary: ProfileKey;
  secondary: ProfileKey;
  isBlend: boolean;
  domainScores: Record<Domain, number>;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function scoreAssessment(answers: number[]): AssessmentScores {
  if (answers.length !== questions.length || answers.some((answer) => answer < 1 || answer > 5)) {
    throw new Error('All 32 questions require an answer from 1 to 5.');
  }

  const normalized = questions.map((question, index) => {
    const value = question.reverse ? 6 - answers[index] : answers[index];
    return ((value - 1) / 4) * 100;
  });

  const meanForAxis = (axis: Axis) => {
    const values = normalized.filter((_, index) => questions[index].axis === axis);
    return clamp(values.reduce((sum, value) => sum + value, 0) / values.length);
  };

  const anxiety = meanForAxis('anxiety');
  const avoidance = meanForAxis('avoidance');
  const secureCapacity = meanForAxis('secure');

  const alignments: Record<ProfileKey, number> = {
    secure: clamp(((100 - anxiety) + (100 - avoidance) + secureCapacity) / 3),
    anxious: clamp((anxiety + (100 - avoidance) + (100 - secureCapacity)) / 3),
    dismissive: clamp(((100 - anxiety) + avoidance + (100 - secureCapacity)) / 3),
    fearful: clamp((anxiety + avoidance + (100 - secureCapacity)) / 3),
  };
  const ranked = (Object.keys(alignments) as ProfileKey[]).sort((a, b) => alignments[b] - alignments[a]);

  const domains = ['closeness', 'trust', 'needs', 'communication', 'conflict', 'boundaries', 'regulation', 'repair'] as Domain[];
  const domainScores = Object.fromEntries(domains.map((domain) => {
    const values = normalized.filter((_, index) => questions[index].domain === domain);
    return [domain, clamp(values.reduce((sum, value) => sum + value, 0) / values.length)];
  })) as Record<Domain, number>;

  return {
    anxiety,
    avoidance,
    secureCapacity,
    alignments,
    ranked,
    primary: ranked[0],
    secondary: ranked[1],
    isBlend: alignments[ranked[0]] - alignments[ranked[1]] <= 8,
    domainScores,
  };
}
