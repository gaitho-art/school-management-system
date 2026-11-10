export function normalizeRole(role) {
  const normalizedRole = (role || '').toLowerCase().replace(/\s+/g, '_');
  const aliases = {
    director: 'principal',
    head_master: 'principal',
    headmaster: 'principal',
    class_teacher: 'teacher',
  };
  return aliases[normalizedRole] || normalizedRole;
}

export function canAccessRoute(userRole, allowedRoles = []) {
  const normalizedUserRole = normalizeRole(userRole);
  if (!normalizedUserRole) return false;
  if (allowedRoles.includes('admin') && normalizedUserRole === 'admin') return true;
  return allowedRoles.some((role) => normalizeRole(role) === normalizedUserRole);
}

export const routeAccess = {
  dashboard: ['admin', 'director', 'head_master', 'headmaster', 'class_teacher', 'teacher', 'admissions', 'bursar', 'store_keeper'],
  students: ['admin', 'director', 'head_master', 'headmaster', 'admissions', 'teacher', 'class_teacher'],
  teachers: ['admin', 'director', 'head_master', 'headmaster'],
  classes: ['admin', 'director', 'head_master', 'headmaster', 'class_teacher'],
  attendance: ['admin', 'director', 'head_master', 'headmaster', 'class_teacher', 'teacher'],
  exams: ['admin', 'director', 'head_master', 'headmaster', 'teacher'],
  timetable: ['admin', 'director', 'head_master', 'headmaster', 'class_teacher', 'teacher'],
  transport: ['admin', 'director', 'head_master', 'headmaster'],
  finance: ['admin', 'director', 'head_master', 'headmaster', 'bursar'],
  expenses: ['admin', 'director', 'head_master', 'headmaster', 'bursar'],
  inventory: ['admin', 'director', 'head_master', 'headmaster', 'store_keeper'],
  schoolProfile: ['admin', 'director', 'head_master', 'headmaster'],
  'school-profile': ['admin', 'director', 'head_master', 'headmaster'],
};
