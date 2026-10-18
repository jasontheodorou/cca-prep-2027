/* How I study: the weekly routine and the method behind it, shown on Course
 * as today's part of the week and, on request, seven short cards.
 *
 * The method follows Tim Ferriss's DiSSS (deconstruction, selection,
 * sequencing, stakes), told in plain words: "Make it small" is deconstruction
 * and selection, "Learn in the right order" is sequencing, and "Your week"
 * holds the stakes. The acronym is never shown on screen (Jason, 18 October
 * 2026).
 *
 * Text only: nothing here is tracked or saved. Kept apart from the page code
 * so it can later come from Jason's Markdown notes. */

export type Day = {
  /** "Monday", or "Longer session". */
  when: string
  /** "1 hour", "1 hour if possible", "3 to 4 hours, any day". */
  time: string
  what: string
}

/** The week, Monday first. The longer session can move to any day. */
export const WEEK: Day[] = [
  { when: 'Monday', time: '1 hour', what: 'Recall last week, set this week’s goal, pick the hardest questions.' },
  { when: 'Tuesday', time: '1 hour', what: 'Study those questions, look at an example, explain it without notes.' },
  { when: 'Wednesday', time: '1 hour', what: 'Try questions you have not seen, then go through your mistakes.' },
  { when: 'Thursday', time: '1 hour if possible', what: 'Fix one misunderstanding and practise a variation.' },
  { when: 'Friday', time: '1 hour if possible', what: 'Go back over this week and older topics, and get ready for the longer session.' },
  {
    when: 'Longer session',
    time: '3 to 4 hours, any day',
    what: 'Change and break a small example, work out why, and show you understand it. Take breaks.',
  },
]

/** Today's part of the week, from the day of the week (0 is Sunday). */
export function today(weekday: number): { when: string; time: string; what: string } {
  if (weekday === 0 || weekday === 6) return { when: 'Weekend', time: '', what: 'Your longer session, if it fits this week.' }
  return WEEK[weekday - 1]
}

export type Card = {
  title: string
  /** Plain points, or numbered steps when "numbered" is set. */
  lines?: string[]
  numbered?: boolean
  /** Shown under the lines, in plain type. */
  after?: string[]
  /** The week table, on the "Your week" card. */
  week?: boolean
  why?: string
}

export const CARDS: Card[] = [
  {
    title: 'Aim for something you can show',
    lines: [
      'Each week, choose one thing you will be able to do without help by the end of it. For example: “Choose between a hook and a prompt instruction, and explain why.”',
      'Count what you can do, not pages read or videos watched.',
    ],
    why: 'The exam gives you a situation and asks what you would do. Being able to decide is what scores, so that is what to practise.',
  },
  {
    title: 'Make it small',
    lines: [
      'Break the week’s goal into 3 to 5 small questions or decisions.',
      'Start with the ones you find hardest, and the ones that help with several parts of the exam.',
      'Anything you skip stays on Progress, to come back to.',
    ],
    why: 'A big topic is hard to start and easy to avoid. A small question can be finished in one sitting.',
  },
  {
    title: 'Learn in the right order',
    numbered: true,
    lines: [
      'Look at a small example that works.',
      'Predict what it will do before you run it.',
      'Change one thing and see what happens.',
      'Break it on purpose and work out why it broke.',
      'Try a situation you have not seen before.',
    ],
    why: 'Each step builds on the one before. Breaking things shows you the edges of an idea, which is where exam questions sit.',
  },
  {
    title: 'Work each task like this',
    numbered: true,
    lines: [
      'Try first. Answer or predict without help.',
      'Say why. Explain your answer and the best alternative.',
      'Find the gap. Study just that, or ask Claude to critique your try.',
      'Check the source. Look up anything you are unsure of in the official exam guide.',
      'Try again. Do a fresh example without help.',
      'Note what is still wrong, in that day’s note on Momentum.',
    ],
    after: ['Make the design decision yourself before you see Claude’s answer. Claude can write the code and explain the syntax.'],
    why: 'Trying before you are told makes the answer stick, and explaining the alternative shows whether you understand the difference.',
  },
  {
    title: 'Your week',
    week: true,
    after: [
      'Monday to Wednesday and the longer session matter most. The rest is optional.',
      'Two full employer preparation days: use them for the guide’s four exercises.',
    ],
    why: 'Short, regular sessions keep ideas fresh, and the longer session gives room to build something and make mistakes.',
  },
  {
    title: 'When the week does not go to plan',
    lines: [
      'Aim for fewer questions this week.',
      'If you can, keep a short planning session, a little recall without notes and a smaller practical task.',
      'Unfinished work moves to a spare week.',
      'Never double the next week or catch up in the evenings.',
    ],
  },
  {
    title: 'End the week',
    lines: ['What can I now decide without help?', 'What mistake am I still making?', 'What should I practise next week?'],
    after: ['Green days on Momentum show effort. Ticks on Progress show what you can do. Neither predicts a pass.'],
  },
]
