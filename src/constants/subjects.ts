export const SUBJECTS = [
  { id: 'javascript', name: 'JavaScript', icon: '⚡' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'devops', name: 'DevOps', icon: '🚀' },
  { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔐' },
  { id: 'csharp', name: 'C#', icon: '💎' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'react', name: 'React', icon: '⚛️' },
  { id: 'nodejs', name: 'Node.js', icon: '🟢' },
] as const;

export type SubjectId = typeof SUBJECTS[number]['id'];
