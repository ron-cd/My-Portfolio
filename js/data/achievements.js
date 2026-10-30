/**
 * achievements.js — Data for the ACHIEVEMENTS screen.
 *
 * `manual` entries are written here. Certification and completed-project
 * achievements are generated automatically from certifications.js and
 * projects.js so nothing is duplicated. Only add things that really happened.
 *
 * icon: a sprite name from js/core/sprites.js
 * group: 'academic' | 'leadership' | 'competition'
 * short: optional shorter caption under the badge (defaults to name)
 * count: optional number shown on the badge when you earned the same thing several times
 */

export const GROUPS = [
  { id: 'academic', label: 'ACADEMIC' },
  { id: 'leadership', label: 'LEADERSHIP' },
  { id: 'competition', label: 'COMPETITIONS' },
  { id: 'certification', label: 'CERTIFICATIONS' },
  { id: 'project', label: 'QUESTS CLEARED' },
];

export const manual = [
  {
    id: 'deans-list',
    group: 'academic',
    icon: 'medal',
    name: "Dean's List",
    count: 2,
    description: 'Made the Dean\'s List twice: 1st, 2nd, and 3rd Term of Academic Year 2024 – 2025, and 1st Term of Academic Year 2025 – 2026.',
    date: 'AY 2024 – 2026',
  },
  {
    id: 'shs-honors',
    group: 'academic',
    icon: 'book',
    name: 'Graduated with Honors',
    description: 'Senior High School, ICT Strand, Children of Fatima School Inc.',
    date: '2024',
  },
  {
    id: 'computer-club-president',
    group: 'leadership',
    icon: 'crown',
    name: 'President, Computer Club',
    description: 'Led the Computer Club.',
    date: '2024 – 2025',
  },
  {
    id: 'code-events-committee',
    group: 'leadership',
    icon: 'flag',
    name: 'Events Committee, CODE NU Clark',
    description: 'Helped plan and run events for the CODE NU Clark student organization.',
    date: '2024 – 2025',
  },
  {
    id: 'codechum-challenge',
    group: 'competition',
    icon: 'trophy',
    name: 'CodeChum National Programming Challenge',
    short: 'CodeChum Challenge',
    description: 'Participant.',
    date: null,
  },
];
