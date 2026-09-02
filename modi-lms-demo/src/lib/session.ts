// 데모 역할 저장 — 네 기존 코드와 동일한 key('demo_role')·값('student'|'teacher') 사용.
// 기존 LearningPage/MyPage/CourseDetail 의 localStorage.getItem('demo_role') 와 그대로 호환됨.
export type Role = 'student' | 'teacher';
const KEY = 'demo_role';
export const getRole = (): Role | null => (localStorage.getItem(KEY) as Role) || null;
export const setRole = (r: Role) => localStorage.setItem(KEY, r);
export const clearRole = () => localStorage.removeItem(KEY);
export const isTeacher = () => getRole() === 'teacher';
