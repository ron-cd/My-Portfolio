/**
 * site.js — Site-wide settings, contact details, and menu definition.
 */

export const site = {
  title: 'PLAYER ONE',
  subtitle: 'A DEVELOPER QUEST',
  tagline: 'An interactive portfolio experience.',
  url: 'https://ron-cd.github.io/My-Portfolio/',
};

/** The screens you can walk to in the village. Labels are used for the building signs and the LOCATIONS list. `id` must match a scene id in js/main.js. */
export const menuItems = [
  { id: 'profile', label: 'PROFILE', icon: 'user', hint: 'Character status: who I am, what I study, and what I can do.' },
  { id: 'skills', label: 'SKILL TREE', icon: 'tree', hint: 'Certifications as a branching tree of connected nodes.' },
  { id: 'quests', label: 'QUEST LOG', icon: 'scroll', hint: 'Projects presented as quests, with roles, tech, and links.' },
  { id: 'achievements', label: 'ACHIEVEMENTS', icon: 'trophy', hint: 'Academic, leadership, and learning milestones.' },
  { id: 'contact', label: 'CONTACT', icon: 'envelope', hint: 'Invite me to your party: email, GitHub, LinkedIn, and CV.' },
];

export const contact = {
  email: 'ronkydc@gmail.com',
  links: [
    { id: 'github', label: 'GitHub', value: 'github.com/ron-cd', href: 'https://github.com/ron-cd', icon: 'chip' },
    { id: 'linkedin', label: 'LinkedIn', value: 'Aaron Dela Cruz', href: 'https://www.linkedin.com/in/aaron-dela-cruz-99734a30b/', icon: 'user' },
  ],
  /**
   * "Kind of quest" choices on the CONTACT letter. `subject` starts the email subject line.
   * The first one is selected by default.
   */
  topics: [
    { id: 'internship', label: 'INTERNSHIP OFFER', subject: 'Internship opportunity' },
    { id: 'project', label: 'PROJECT OR TEAM-UP', subject: 'Project or collaboration' },
    { id: 'question', label: 'A QUESTION', subject: 'Question' },
    { id: 'hello', label: 'JUST SAYING HI', subject: 'Hello' },
  ],
  /** The CV file exists in the project at this path. */
  resume: { label: 'DOWNLOAD CV (PDF)', href: 'assets/Aaron_Dela_Cruz_CV.pdf' },
};
