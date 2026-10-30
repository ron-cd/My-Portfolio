/**
 * profile.js — Everything shown on the PLAYER (profile) screen and the hub status panel.
 * Edit this file to update your information. No UI code lives here.
 *
 * Only real information belongs here. Anything marked `placeholder: true`
 * is a stand-in that you should replace.
 */

export const profile = {
  /** Display names */
  nickname: 'Ron',
  fullName: 'Aaron Kyle Dela Cruz',
  shortName: 'Aaron Dela Cruz',

  /** RPG-style labels used on the hub and profile screens */
  characterClass: 'Developer',
  title: 'IT Student · Mobile & Web Applications',
  specialization: 'Mobile & Web Applications',
  status: 'BSIT student · Seeking internship opportunities',
  location: 'Pampanga, Philippines',

  /** Short introduction (professional tone) */
  intro: [
    'I am an Information Technology student specializing in Mobile and Web Applications, with a solid footing in backend development, database management, Android development, and problem solving.',
    'I learn by building: mobile apps, web projects, data dashboards, and a Dockerized CI/CD pipeline for a student event system. I am looking for internship opportunities where I can apply these skills and grow within a development team.',
  ],

  education: [
    {
      school: 'National University – Clark',
      program: 'Bachelor of Science in Information Technology',
      detail: 'Specialization in Mobile & Web Applications',
      years: '2024 – Present',
    },
    {
      school: 'Children of Fatima School Inc.',
      program: 'Senior High School – ICT Strand',
      detail: 'Graduated with Honors',
      years: '2022 – 2024',
    },
  ],

  interests: [
    'Mobile app development (Kotlin, Flutter)',
    'Web development and backend APIs',
    'Databases and data visualization',
    'DevOps basics: Docker and CI/CD',
  ],

  /** Grouped skills as plain tags. No numeric ratings on purpose. */
  abilities: [
    { group: 'Languages', tags: ['Java', 'Kotlin', 'Python', 'JavaScript', 'HTML / CSS', 'SQL'] },
    { group: 'Mobile', tags: ['Android (Kotlin / XML)', 'Flutter', 'Firebase'] },
    { group: 'Web & Backend', tags: ['Node.js', 'Express', 'React', 'PHP / Laravel', 'Responsive design'] },
    { group: 'Data', tags: ['MySQL', 'MariaDB', 'PostgreSQL', 'MongoDB', 'Tableau', 'Excel'] },
    { group: 'Tools', tags: ['Git / GitHub', 'Docker', 'Jenkins', 'Nginx', 'Testing & debugging'] },
  ],

  /**
   * The EQUIPMENT screen (profile). Each slot holds real skills from `abilities`
   * above (scripts/validate-data.mjs checks the names match). `match` lists the
   * names to look for in a project's `tech` (defaults to the item name), so the
   * "used in" lines are worked out from js/data/projects.js, never typed by hand.
   * `note` is optional extra, accurate detail shown when the item is inspected.
   */
  gear: {
    left: {
      title: 'LANGUAGES',
      slots: [
        { slot: 'MAIN HAND', icon: 'sparkle', items: [{ name: 'JavaScript', match: ['JavaScript', 'JavaScript (ES modules)'] }] },
        { slot: 'OFF HAND', icon: 'chip', items: [{ name: 'Kotlin' }] },
        { slot: 'SPELLBOOK', icon: 'book', items: [{ name: 'Python' }, { name: 'SQL', note: 'Earned the IT Specialist: Databases certification.' }] },
      ],
    },
    right: {
      title: 'GEAR',
      slots: [
        { slot: 'ARMOR', icon: 'shield', items: [{ name: 'Docker', match: ['Docker Compose'] }, { name: 'Jenkins' }, { name: 'Nginx' }] },
        { slot: 'FRAMEWORKS', icon: 'gear', items: [{ name: 'Flutter' }, { name: 'Node.js' }, { name: 'Express' }] },
        { slot: 'DATA', icon: 'chart', items: [{ name: 'PostgreSQL' }, { name: 'Tableau' }] },
      ],
    },
  },

  strengths: [
    { name: 'Problem solving', text: 'Breaks unfamiliar problems into small, testable steps.' },
    { name: 'Leadership', text: 'President of the Computer Club (2024 – 2025).' },
    { name: 'Collaboration', text: 'Events Committee member, CODE NU Clark (2024 – 2025).' },
    { name: 'Fast learner', text: 'Picks up new stacks quickly through hands-on projects.' },
  ],

  goals: [
    'Land an internship in mobile or web development.',
    'Keep earning industry certifications alongside my degree.',
    'Ship projects that real users can rely on.',
  ],
};
