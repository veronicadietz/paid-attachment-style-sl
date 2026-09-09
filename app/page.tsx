'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clock3, Download, LoaderCircle, Mail, ShieldCheck, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AssessmentScores, profiles, questions } from '@/lib/assessment';

type Phase = 'intro' | 'identity' | 'quiz' | 'submitting' | 'results';
type SubmissionResult = { id: string; scores: AssessmentScores; downloadUrl: string; emailStatus: string };

export default function Home() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(0));
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      setFirstName(params.get('first_name') ?? params.get('firstName') ?? '');
      setEmail(params.get('email') ?? '');
    });
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'start_attachment_profile', title: 'Start attachment profile',
      description: 'Open the Personalized Attachment Profile and optionally prefill the customer name and email.',
      inputSchema: { type: 'object', properties: { firstName: { type: 'string' }, email: { type: 'string' } }, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input: unknown) => {
        if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Input must be an object.');
        const values = input as { firstName?: unknown; email?: unknown; [key: string]: unknown };
        if (Object.keys(values).some((key) => !['firstName', 'email'].includes(key))) throw new Error('Only firstName and email are accepted.');
        if (values.firstName !== undefined && typeof values.firstName !== 'string') throw new Error('firstName must be a string.');
        if (values.email !== undefined && typeof values.email !== 'string') throw new Error('email must be a string.');
        if (values.firstName) setFirstName(values.firstName.slice(0, 80));
        if (values.email) setEmail(values.email.slice(0, 254));
        setPhase('identity');
        return { status: 'ready', nextStep: 'Confirm customer details and privacy consent.' };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool({
      name: 'read_attachment_profile_progress', title: 'Read attachment profile progress',
      description: 'Read the current assessment stage and number of answered questions without changing anything.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: async () => ({ phase, answered: answers.filter(Boolean).length, total: questions.length }),
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [phase, answers]);

  const answeredCount = answers.filter(Boolean).length;
  const currentAnswer = answers[questionIndex];
  const progress = Math.round((answeredCount / questions.length) * 100);
  const profileLabel = useMemo(() => {
    if (!result) return '';
    const { scores } = result;
    return scores.isBlend ? `${profiles[scores.primary].shortName} + ${profiles[scores.secondary].shortName}` : profiles[scores.primary].name;
  }, [result]);

  async function confirmIdentity(event: { preventDefault(): void }) {
    event.preventDefault();
    setError('');
    if (!firstName.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter the first name and email used at checkout.');
    if (!consent) return setError('Please confirm that you understand how your responses will be used.');
    setCheckingAccess(true);
    try {
      const response = await fetch('/api/access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await response.json() as { accessToken?: string; error?: string };
      if (!response.ok || !data.accessToken) throw new Error(data.error ?? 'We could not confirm your purchase.');
      setAccessToken(data.accessToken);
      setPhase('quiz');
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : 'We could not confirm your purchase.');
    } finally {
      setCheckingAccess(false);
    }
  }

  function chooseAnswer(value: number) {
    setAnswers((current) => current.map((answer, index) => index === questionIndex ? value : answer));
  }

  async function nextQuestion() {
    if (!currentAnswer) return;
    if (questionIndex < questions.length - 1) return setQuestionIndex((current) => current + 1);
    await submitAssessment();
  }

  async function submitAssessment() {
    setPhase('submitting');
    setError('');
    try {
      const params = new URLSearchParams(window.location.search);
      const response = await fetch('/api/assessments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, answers, accessToken, ivoreyContactId: params.get('contact_id') ?? undefined }),
      });
      const data = await response.json() as SubmissionResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'We could not create your report.');
      setResult(data); setPhase('results'); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'We could not create your report. Please try again.');
      setPhase('quiz');
    }
  }

  return <main className="min-h-screen overflow-hidden bg-background text-foreground">
    <div className="page-glow" aria-hidden="true" />
    <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
      <Image src="/securely-loved-logo.png" alt="Securely Loved" width={64} height={64} className="h-14 w-14 object-contain sm:h-16 sm:w-16" priority />
      <div className="text-right font-sans text-xs leading-relaxed text-muted-foreground sm:text-sm"><p className="font-medium text-foreground">Personalized Attachment Profile</p><p>Created by Bev Mitelman, M.A.</p></div>
    </header>

    {phase === 'intro' && <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-7 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-14">
      <IntroCopy />
      <div className="assessment-card"><span className="step-label">Your assessment</span><h2 className="mt-4 font-heading text-3xl font-semibold leading-tight sm:text-[2.15rem]">A clear picture of your relational blueprint</h2><p className="mt-4 font-sans leading-7 text-muted-foreground">Answer based on what is generally true in your closest adult relationships - not only what happened in one difficult moment.</p><div className="my-7 h-px bg-border" /><p className="font-sans text-sm leading-6 text-muted-foreground">Your report will include your leading pattern, any closely matched secondary pattern, triggers, needs, strengths, and practical next steps.</p><Button size="lg" className="mt-7 h-13 w-full rounded-full bg-primary px-6 font-sans text-[15px] text-white shadow-[0_12px_30px_rgba(196,104,122,.25)] hover:bg-primary/90" onClick={() => setPhase('identity')}>Begin my profile <ArrowRight className="ml-1 size-4" /></Button></div>
    </section>}

    {phase === 'identity' && <section className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-20 pt-6 sm:px-8 sm:pt-12"><div className="assessment-card">
      <button className="back-link" onClick={() => setPhase('intro')}><ArrowLeft className="size-4" /> Back</button><span className="step-label mt-6 block">Before you begin</span><h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">Where should we send your profile?</h1><p className="mt-4 font-sans leading-7 text-muted-foreground">Use the same email address you entered when purchasing your Personalized Attachment Profile.</p>
      <form className="mt-7 space-y-5" onSubmit={confirmIdentity}>
        <label htmlFor="first-name" className="block font-sans text-sm font-medium">First name<Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" className="mt-2 h-12 rounded-xl bg-secondary px-4" placeholder="First name" /></label>
        <label htmlFor="email" className="block font-sans text-sm font-medium">Email address<Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="mt-2 h-12 rounded-xl bg-secondary px-4" placeholder="you@example.com" /></label>
        <div className="flex items-start gap-3 rounded-xl border border-border bg-white/70 p-4 font-sans text-xs leading-5 text-muted-foreground"><Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(checked === true)} className="mt-0.5" /><label htmlFor="consent">I understand this is an educational self-reflection tool, not a clinical diagnosis. My answers will be used to create and retain my personalized report.</label></div>
        {error && <p role="alert" className="font-sans text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={checkingAccess} className="h-13 w-full rounded-full bg-primary font-sans text-[15px] text-white hover:bg-primary/90">{checkingAccess ? <><LoaderCircle className="size-4 animate-spin" /> Confirming purchase</> : <>Continue to the questions <ArrowRight className="ml-1 size-4" /></>}</Button>
      </form>
    </div></section>}

    {(phase === 'quiz' || phase === 'submitting') && <section className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-20 pt-5 sm:px-8 sm:pt-10"><div className="assessment-card min-h-[520px]">
      <div className="flex items-center justify-between font-sans text-xs text-muted-foreground"><span>Question {questionIndex + 1} of {questions.length}</span><span>{progress}% complete</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(3, progress)}%` }} /></div>
      {phase === 'submitting' ? <div className="flex min-h-[390px] flex-col items-center justify-center text-center"><LoaderCircle className="size-9 animate-spin text-primary" /><h1 className="mt-6 font-heading text-3xl font-semibold">Creating your personal profile</h1><p className="mt-3 max-w-md font-sans leading-7 text-muted-foreground">We are bringing your scores, relational patterns, and next steps together in your report.</p></div> : <>
        <p className="step-label mt-10">How true is this for you?</p><h1 className="mt-4 min-h-[104px] font-heading text-2xl font-medium leading-snug sm:text-3xl">{questions[questionIndex].text}</h1>
        <div className="mt-7 grid gap-2.5 font-sans sm:grid-cols-5">{['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'].map((label, index) => { const value = index + 1; return <button key={label} className={`answer-option ${currentAnswer === value ? 'selected' : ''}`} type="button" onClick={() => chooseAnswer(value)} aria-pressed={currentAnswer === value}><strong>{value}</strong><span>{label}</span></button>; })}</div>
        {error && <p role="alert" className="mt-5 font-sans text-sm text-destructive">{error}</p>}
        <div className="mt-8 flex items-center justify-between gap-4"><Button variant="ghost" className="rounded-full font-sans" onClick={() => questionIndex === 0 ? setPhase('identity') : setQuestionIndex((current) => current - 1)}><ArrowLeft className="size-4" /> Back</Button><Button className="h-11 rounded-full bg-primary px-6 font-sans text-white hover:bg-primary/90" disabled={!currentAnswer} onClick={nextQuestion}>{questionIndex === questions.length - 1 ? 'Create my profile' : 'Continue'} <ArrowRight className="size-4" /></Button></div>
      </>}
    </div></section>}

    {phase === 'results' && result && <section className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-5 sm:px-8 sm:pt-10">
      <div className="results-hero"><p className="step-label">{firstName}, your profile is ready</p><h1 className="mt-4 font-heading text-4xl font-semibold leading-tight sm:text-5xl">{profileLabel}</h1><p className="mt-5 max-w-2xl font-sans text-lg leading-8 text-muted-foreground">{profiles[result.scores.primary].essence}</p>{result.scores.isBlend && <p className="mt-4 max-w-2xl font-sans leading-7 text-muted-foreground">Your {profiles[result.scores.secondary].shortName} pattern is close enough to matter. Your PDF explains how both patterns can appear together.</p>}<div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button size="lg" className="h-12 rounded-full bg-primary px-7 font-sans text-white hover:bg-primary/90" onClick={() => window.location.assign(result.downloadUrl)}><Download className="size-4" /> Download my PDF</Button><div className="inline-flex items-center gap-2 px-2 font-sans text-sm text-muted-foreground"><Mail className="size-4 text-primary" /> {result.emailStatus === 'sent' ? `A copy was sent to ${email}` : 'Email delivery will activate when the sender account is connected.'}</div></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-3"><ScoreCard label="Attachment anxiety" score={result.scores.anxiety} color="rose" /><ScoreCard label="Attachment avoidance" score={result.scores.avoidance} color="navy" /><ScoreCard label="Secure functioning" score={result.scores.secureCapacity} color="sage" /></div><p className="mt-6 text-center font-sans text-xs leading-5 text-muted-foreground">These are educational profile scores, not clinical percentiles or a diagnosis.</p>
    </section>}

    <footer className="relative z-10 border-t border-border/70 px-5 py-6 text-center font-sans text-xs leading-5 text-muted-foreground">This profile is educational and is not a diagnosis or a substitute for mental health care.</footer>
  </main>;
}

function IntroCopy() {
  return <div><p className="eyebrow mb-5"><span /> Securely Loved</p><h1 className="max-w-2xl font-heading text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-6xl">Understand the patterns behind how you love.</h1><p className="mt-6 max-w-xl font-sans text-lg leading-8 text-muted-foreground">Your personalized profile looks beneath the label to reveal how you seek closeness, protect yourself, communicate, and repair.</p><div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 font-sans text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-primary" /> 8-10 minutes</span><span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-primary" /> 32 thoughtful questions</span><span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Private and educational</span></div></div>;
}

function ScoreCard({ label, score, color }: { label: string; score: number; color: 'rose' | 'navy' | 'sage' }) {
  return <div className="score-card"><div className="flex items-center justify-between"><span className="font-sans text-sm font-medium">{label}</span><strong className="font-heading text-2xl">{score}</strong></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full score-${color}`} style={{ width: `${score}%` }} /></div><div className="mt-4 inline-flex items-center gap-2 font-sans text-xs text-muted-foreground"><Check className="size-3.5 text-primary" /> Included in your report</div></div>;
}
