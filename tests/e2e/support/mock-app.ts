import { type Page, type Request } from '@playwright/test';

export type MockRole = 'Admin' | 'Instructor' | 'Student';
export type MockExamStatus = 'Draft' | 'Published' | 'Closed';
export type MockQuestionType = 'MCQ' | 'TrueFalse';
export type MockAttemptStatus = 'InProgress' | 'Submitted';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: MockRole;
  createdAt: string;
  updatedAt: string;
}

export interface MockCourse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enrolledUserIds: string[];
}

export interface MockExam {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  courseId: string;
  durationMinutes: number;
  availabilityStart: string | null;
  availabilityEnd: string | null;
  status: MockExamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MockQuestion {
  id: string;
  examId: string;
  order: number;
  type: MockQuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockAttempt {
  id: string;
  examId: string;
  studentId: string;
  status: MockAttemptStatus;
  answers: Record<string, string>;
  score: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockAppState {
  users: MockUser[];
  passwords: Record<string, string>;
  courses: MockCourse[];
  exams: MockExam[];
  questionsByExam: Record<string, MockQuestion[]>;
  attemptsByExam: Record<string, MockAttempt>;
  nextUserId: number;
  nextCourseId: number;
  nextExamId: number;
  nextQuestionId: number;
  nextAttemptId: number;
}

const FIXED_NOW = '2026-04-06T12:00:00.000Z';

function toBase64Url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function jsonResponse(body: unknown, status = 200): { status: number; contentType: string; body: string } {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

function cloneUser(user: MockUser): MockUser {
  return { ...user };
}

function cloneCourse(course: MockCourse): MockCourse {
  return {
    ...course,
    enrolledUserIds: [...course.enrolledUserIds],
  };
}

function createJwt(expirationSecondsFromNow: number, subject: string): string {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: subject,
      exp: Math.floor(Date.now() / 1000) + expirationSecondsFromNow,
    })
  );

  return `${header}.${payload}.signature`;
}

export function createAuthTokens(subject: string): { accessToken: string; refreshToken: string } {
  return {
    accessToken: createJwt(60 * 60, subject),
    refreshToken: createJwt(60 * 60 * 24, `${subject}:refresh`),
  };
}

export function createExpiredAccessToken(subject: string): string {
  return createJwt(-60, subject);
}

export function createMockAppState(): MockAppState {
  const admin: MockUser = {
    id: 'user-admin',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'Admin',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };
  const instructor: MockUser = {
    id: 'user-instructor',
    email: 'instructor@example.com',
    name: 'Instructor User',
    role: 'Instructor',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };
  const student: MockUser = {
    id: 'user-student',
    email: 'student@example.com',
    name: 'Student User',
    role: 'Student',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };

  const courseOne: MockCourse = {
    id: 'course-1',
    code: 'CS101',
    name: 'Foundations of Computing',
    description: 'Core course used by the exam visibility fixtures',
    enrolledUserIds: [admin.id, instructor.id, student.id],
  };

  const courseTwo: MockCourse = {
    id: 'course-2',
    code: 'CS201',
    name: 'Algorithms',
    description: 'Secondary course used to verify enrollment filtering',
    enrolledUserIds: [admin.id, instructor.id],
  };

  const examOne: MockExam = {
    id: 'exam-1',
    title: 'Foundations Midterm',
    description: 'Core coverage for the published exam flow',
    instructorId: instructor.id,
    courseId: courseOne.id,
    durationMinutes: 45,
    availabilityStart: null,
    availabilityEnd: null,
    status: 'Published',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };

  const examTwo: MockExam = {
    id: 'exam-2',
    title: 'Draft Review Exam',
    description: 'A draft exam used to exercise filtering',
    instructorId: instructor.id,
    courseId: courseOne.id,
    durationMinutes: 30,
    availabilityStart: null,
    availabilityEnd: null,
    status: 'Draft',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };

  const examThree: MockExam = {
    id: 'exam-3',
    title: 'Closed Final Exam',
    description: 'A closed exam used to exercise filtering',
    instructorId: instructor.id,
    courseId: courseTwo.id,
    durationMinutes: 60,
    availabilityStart: null,
    availabilityEnd: null,
    status: 'Closed',
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };

  const question: MockQuestion = {
    id: 'question-1',
    examId: examOne.id,
    order: 1,
    type: 'MCQ',
    questionText: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    points: 5,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };

  return {
    users: [admin, instructor, student],
    passwords: {
      'admin@example.com': 'Admin123!',
      'instructor@example.com': 'Instructor123!',
      'student@example.com': 'Student123!',
    },
    courses: [courseOne, courseTwo],
    exams: [examOne, examTwo, examThree],
    questionsByExam: {
      [examOne.id]: [question],
      [examTwo.id]: [],
      [examThree.id]: [],
    },
    attemptsByExam: {},
    nextUserId: 1,
    nextCourseId: 3,
    nextExamId: 4,
    nextQuestionId: 2,
    nextAttemptId: 1,
  };
}

function parseRequestBody(request: Request): Record<string, unknown> {
  const body = request.postData();
  if (!body) return {};

  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function toPublicUser(user: MockUser): MockUser {
  return cloneUser(user);
}

function toPublicCourse(course: MockCourse): MockCourse {
  return cloneCourse(course);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  try {
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getRequestingUser(state: MockAppState, request: Request): MockUser | null {
  const authorization = request.headers()['authorization'];
  if (!authorization?.startsWith('Bearer ')) return null;

  const payload = decodeJwtPayload(authorization.slice('Bearer '.length));
  const subject = typeof payload?.sub === 'string' ? payload.sub : null;
  if (!subject) return null;

  return state.users.find((entry) => entry.id === subject) ?? null;
}

function getCourseById(state: MockAppState, courseId: string): MockCourse | undefined {
  return state.courses.find((entry) => entry.id === courseId);
}

function canAccessExam(state: MockAppState, user: MockUser | null, exam: MockExam): boolean {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  if (user.role === 'Instructor') return exam.instructorId === user.id;
  if (user.role === 'Student') {
    const course = getCourseById(state, exam.courseId);
    return exam.status === 'Published' && !!course?.enrolledUserIds.includes(user.id);
  }

  return false;
}

function canManageExam(user: MockUser | null, exam: MockExam): boolean {
  if (!user) return false;
  if (user.role === 'Admin') return true;
  return user.role === 'Instructor' && exam.instructorId === user.id;
}

function getVisibleExams(state: MockAppState, user: MockUser | null): MockExam[] {
  if (!user) return [];
  if (user.role === 'Admin') return state.exams;
  if (user.role === 'Instructor') return state.exams.filter((exam) => exam.instructorId === user.id);

  return state.exams.filter((exam) => canAccessExam(state, user, exam));
}

function updatePasswordIndex(state: MockAppState, previousEmail: string, nextEmail: string, password?: string): void {
  const previousPassword = state.passwords[previousEmail];
  if (previousEmail !== nextEmail) {
    delete state.passwords[previousEmail];
    if (previousPassword) {
      state.passwords[nextEmail] = previousPassword;
    }
  }

  if (password) {
    state.passwords[nextEmail] = password;
  }
}

export async function mockAppApi(page: Page, state: MockAppState): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname, searchParams } = url;
    const method = request.method();
    const body = parseRequestBody(request);
    const user = getRequestingUser(state, request);

    if (pathname === '/api/courses/me' && method === 'GET') {
      const courses = user
        ? state.courses.filter((course) => course.enrolledUserIds.includes(user.id))
        : [];
      await route.fulfill(jsonResponse({ data: courses.map(toPublicCourse) }));
      return;
    }

    if (pathname === '/api/courses' && method === 'GET') {
      await route.fulfill(jsonResponse({ data: state.courses.map(toPublicCourse) }));
      return;
    }

    if (pathname === '/api/courses' && method === 'POST') {
      const course: MockCourse = {
        id: `course-${state.nextCourseId++}`,
        code: String(body.code ?? '').trim(),
        name: String(body.name ?? '').trim(),
        description: typeof body.description === 'string' ? body.description : null,
        enrolledUserIds: [],
      };

      state.courses.push(course);
      await route.fulfill(jsonResponse({ data: toPublicCourse(course) }, 201));
      return;
    }

    if (pathname.match(/^\/api\/courses\/[^/]+\/enrollments$/) && method === 'POST') {
      const courseId = pathname.split('/')[3];
      const course = getCourseById(state, courseId);
      if (!course) {
        await route.fulfill(jsonResponse({ error: 'Course not found' }, 404));
        return;
      }

      const userIds = Array.isArray(body.userIds)
        ? body.userIds.map((value) => String(value))
        : body.userId
          ? [String(body.userId)]
          : [];

      for (const userId of userIds) {
        if (!course.enrolledUserIds.includes(userId)) {
          course.enrolledUserIds.push(userId);
        }
      }

      await route.fulfill(jsonResponse({ message: 'Users enrolled successfully' }));
      return;
    }

    if (pathname.match(/^\/api\/courses\/[^/]+\/enrollments\/[^/]+$/) && method === 'DELETE') {
      const segments = pathname.split('/');
      const courseId = segments[3];
      const userId = segments[5];
      const course = getCourseById(state, courseId);
      if (!course) {
        await route.fulfill(jsonResponse({ error: 'Course not found' }, 404));
        return;
      }

      course.enrolledUserIds = course.enrolledUserIds.filter((entry) => entry !== userId);
      await route.fulfill(jsonResponse({ message: 'User removed from course successfully' }));
      return;
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const email = String(body.email ?? '');
      const password = String(body.password ?? '');
      const user = state.users.find((entry) => entry.email === email);

      if (!user || state.passwords[email] !== password) {
        await route.fulfill(jsonResponse({ error: 'Invalid email or password' }, 401));
        return;
      }

      const tokens = createAuthTokens(user.id);
      await route.fulfill(
        jsonResponse({
          success: true,
          data: toPublicUser(user),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
      return;
    }

    if (pathname === '/api/auth/signup' && method === 'POST') {
      const email = String(body.email ?? '');
      const name = String(body.name ?? '');
      const password = String(body.password ?? '');
      const role = String(body.role ?? 'Student') as MockRole;

      if (state.users.some((entry) => entry.email === email)) {
        await route.fulfill(jsonResponse({ error: 'Email already exists' }, 409));
        return;
      }

      const user: MockUser = {
        id: `user-${state.nextUserId++}`,
        email,
        name,
        role,
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      };

      state.users.push(user);
      state.passwords[email] = password;

      const tokens = createAuthTokens(user.id);
      await route.fulfill(
        jsonResponse({
          success: true,
          data: toPublicUser(user),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
      return;
    }

    if (pathname === '/api/auth/refresh' && method === 'POST') {
      const subject = String(body.refreshToken ?? 'refreshed-user');
      await route.fulfill(jsonResponse({ accessToken: createAuthTokens(subject).accessToken }));
      return;
    }

    if (pathname === '/api/users' && method === 'GET') {
      const role = searchParams.get('role');
      const users = role ? state.users.filter((entry) => entry.role === role) : state.users;
      await route.fulfill(jsonResponse({ data: users.map(toPublicUser) }));
      return;
    }

    if (pathname.startsWith('/api/users/') && method === 'GET') {
      const id = pathname.split('/').at(-1) ?? '';
      const user = state.users.find((entry) => entry.id === id);
      if (!user) {
        await route.fulfill(jsonResponse({ error: 'User not found' }, 404));
        return;
      }

      await route.fulfill(jsonResponse({ data: toPublicUser(user) }));
      return;
    }

    if (pathname === '/api/users' && method === 'POST') {
      const email = String(body.email ?? '');
      const name = String(body.name ?? '');
      const password = String(body.password ?? '');
      const role = String(body.role ?? 'Student') as MockRole;

      const user: MockUser = {
        id: `user-${state.nextUserId++}`,
        email,
        name,
        role,
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      };

      state.users.push(user);
      state.passwords[email] = password;
      await route.fulfill(jsonResponse({ data: toPublicUser(user) }, 201));
      return;
    }

    if (pathname.startsWith('/api/users/') && method === 'PATCH') {
      const id = pathname.split('/').at(-1) ?? '';
      const user = state.users.find((entry) => entry.id === id);
      if (!user) {
        await route.fulfill(jsonResponse({ error: 'User not found' }, 404));
        return;
      }

      const previousEmail = user.email;
      if (typeof body.name === 'string') user.name = body.name;
      if (typeof body.email === 'string') user.email = body.email;
      if (typeof body.role === 'string') user.role = body.role as MockRole;
      if (typeof body.password === 'string' && body.password.length > 0) {
        state.passwords[user.email] = body.password;
      }

      updatePasswordIndex(
        state,
        previousEmail,
        user.email,
        typeof body.password === 'string' && body.password.length > 0 ? body.password : undefined
      );
      user.updatedAt = FIXED_NOW;

      await route.fulfill(jsonResponse({ data: toPublicUser(user) }));
      return;
    }

    if (pathname.startsWith('/api/users/') && method === 'DELETE') {
      const id = pathname.split('/').at(-1) ?? '';
      const index = state.users.findIndex((entry) => entry.id === id);
      if (index === -1) {
        await route.fulfill(jsonResponse({ error: 'User not found' }, 404));
        return;
      }

      const [removed] = state.users.splice(index, 1);
      delete state.passwords[removed.email];
      await route.fulfill(jsonResponse({ message: 'User deleted successfully' }));
      return;
    }

    if (pathname === '/api/exams' && method === 'GET') {
      await route.fulfill(jsonResponse({ data: getVisibleExams(state, user) }));
      return;
    }

    if (pathname === '/api/exams' && method === 'POST') {
      if (!body.courseId) {
        await route.fulfill(jsonResponse({ error: 'Course is required' }, 400));
        return;
      }

      const exam: MockExam = {
        id: `exam-${state.nextExamId++}`,
        title: String(body.title ?? ''),
        description: String(body.description ?? ''),
        instructorId: String(body.instructorId ?? state.users.find((entry) => entry.role === 'Instructor')?.id ?? ''),
        courseId: String(body.courseId ?? ''),
        durationMinutes: Number(body.durationMinutes ?? 0),
        availabilityStart: (body.availabilityStart as string | null | undefined) ?? null,
        availabilityEnd: (body.availabilityEnd as string | null | undefined) ?? null,
        status: (body.status as MockExamStatus | undefined) ?? 'Draft',
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      };

      state.exams.push(exam);
      state.questionsByExam[exam.id] = [];
      await route.fulfill(jsonResponse({ data: exam }, 201));
      return;
    }

    if (pathname.startsWith('/api/exams/') && !pathname.includes('/questions') && method === 'GET') {
      const id = pathname.split('/').at(-1) ?? '';
      const exam = state.exams.find((entry) => entry.id === id);
      if (!exam) {
        await route.fulfill(jsonResponse({ error: 'Exam not found' }, 404));
        return;
      }

      if (!canAccessExam(state, user, exam)) {
        await route.fulfill(jsonResponse({ error: 'Access denied' }, 403));
        return;
      }

      await route.fulfill(jsonResponse({ data: exam }));
      return;
    }

    if (pathname.startsWith('/api/exams/') && !pathname.includes('/questions') && method === 'PATCH') {
      const id = pathname.split('/').at(-1) ?? '';
      const exam = state.exams.find((entry) => entry.id === id);
      if (!exam) {
        await route.fulfill(jsonResponse({ error: 'Exam not found' }, 404));
        return;
      }

      if (!canManageExam(user, exam)) {
        await route.fulfill(jsonResponse({ error: 'Access denied' }, 403));
        return;
      }

      if (typeof body.title === 'string') exam.title = body.title;
      if (typeof body.description === 'string') exam.description = body.description;
      if (typeof body.durationMinutes === 'number' || typeof body.durationMinutes === 'string') {
        exam.durationMinutes = Number(body.durationMinutes);
      }
      if (typeof body.courseId === 'string' && body.courseId.length > 0) exam.courseId = body.courseId;
      if (Object.prototype.hasOwnProperty.call(body, 'availabilityStart')) {
        exam.availabilityStart = (body.availabilityStart as string | null | undefined) ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'availabilityEnd')) {
        exam.availabilityEnd = (body.availabilityEnd as string | null | undefined) ?? null;
      }
      if (typeof body.status === 'string') exam.status = body.status as MockExamStatus;
      if (typeof body.instructorId === 'string') exam.instructorId = body.instructorId;
      exam.updatedAt = FIXED_NOW;

      await route.fulfill(jsonResponse({ data: exam }));
      return;
    }

    if (pathname.startsWith('/api/exams/') && !pathname.includes('/questions') && method === 'DELETE') {
      const id = pathname.split('/').at(-1) ?? '';
      const index = state.exams.findIndex((entry) => entry.id === id);
      if (index === -1) {
        await route.fulfill(jsonResponse({ error: 'Exam not found' }, 404));
        return;
      }

      if (!canManageExam(user, state.exams[index])) {
        await route.fulfill(jsonResponse({ error: 'Access denied' }, 403));
        return;
      }

      state.exams.splice(index, 1);
      delete state.questionsByExam[id];
      delete state.attemptsByExam[id];
      await route.fulfill(jsonResponse({ message: 'Exam deleted successfully' }));
      return;
    }

    if (pathname.match(/^\/api\/exams\/[^/]+\/questions$/) && method === 'GET') {
      const examId = pathname.split('/')[3];
      const exam = state.exams.find((entry) => entry.id === examId);
      if (exam && !canAccessExam(state, user, exam)) {
        await route.fulfill(jsonResponse({ error: 'Access denied' }, 403));
        return;
      }

      await route.fulfill(jsonResponse({ data: state.questionsByExam[examId] ?? [] }));
      return;
    }

    if (pathname.match(/^\/api\/exams\/[^/]+\/questions$/) && method === 'POST') {
      const examId = pathname.split('/')[3];
      const question: MockQuestion = {
        id: `question-${state.nextQuestionId++}`,
        examId,
        order: Number(body.order ?? 1),
        type: String(body.type ?? 'MCQ') as MockQuestionType,
        questionText: String(body.questionText ?? ''),
        options: Array.isArray(body.options) ? body.options.map((option) => String(option)) : [],
        correctAnswer: String(body.correctAnswer ?? ''),
        points: Number(body.points ?? 1),
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      };

      state.questionsByExam[examId] = [...(state.questionsByExam[examId] ?? []), question];
      await route.fulfill(jsonResponse({ data: question }, 201));
      return;
    }

    if (pathname.match(/^\/api\/exams\/[^/]+\/questions\/[^/]+$/) && method === 'PATCH') {
      const segments = pathname.split('/');
      const examId = segments[3];
      const questionId = segments[5];
      const questions = state.questionsByExam[examId] ?? [];
      const question = questions.find((entry) => entry.id === questionId);

      if (!question) {
        await route.fulfill(jsonResponse({ error: 'Question not found' }, 404));
        return;
      }

      if (typeof body.order === 'number' || typeof body.order === 'string') question.order = Number(body.order);
      if (typeof body.type === 'string') question.type = body.type as MockQuestionType;
      if (typeof body.questionText === 'string') question.questionText = body.questionText;
      if (Array.isArray(body.options)) question.options = body.options.map((option) => String(option));
      if (typeof body.correctAnswer === 'string') question.correctAnswer = body.correctAnswer;
      if (typeof body.points === 'number' || typeof body.points === 'string') question.points = Number(body.points);
      question.updatedAt = FIXED_NOW;

      await route.fulfill(jsonResponse({ data: question }));
      return;
    }

    if (pathname.match(/^\/api\/exams\/[^/]+\/questions\/[^/]+$/) && method === 'DELETE') {
      const segments = pathname.split('/');
      const examId = segments[3];
      const questionId = segments[5];
      const questions = state.questionsByExam[examId] ?? [];
      const index = questions.findIndex((entry) => entry.id === questionId);

      if (index === -1) {
        await route.fulfill(jsonResponse({ error: 'Question not found' }, 404));
        return;
      }

      questions.splice(index, 1);
      state.questionsByExam[examId] = questions;
      await route.fulfill(jsonResponse({ message: 'Question deleted successfully' }));
      return;
    }

    if (pathname.match(/^\/api\/exams\/[^/]+\/start$/) && method === 'POST') {
      const examId = pathname.split('/')[3];
      const exam = state.exams.find((entry) => entry.id === examId);
      if (!exam || !canAccessExam(state, user, exam)) {
        await route.fulfill(jsonResponse({ error: 'Access denied' }, 403));
        return;
      }

      const attempt = state.attemptsByExam[examId] ?? {
        id: `attempt-${state.nextAttemptId++}`,
        examId,
        studentId: state.users.find((entry) => entry.role === 'Student')?.id ?? 'user-student',
        status: 'InProgress' as const,
        answers: {},
        score: null,
        startedAt: FIXED_NOW,
        submittedAt: null,
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      };

      state.attemptsByExam[examId] = attempt;
      await route.fulfill(jsonResponse({ data: attempt }));
      return;
    }

    if (pathname.match(/^\/api\/exams\/[^/]+\/submit$/) && method === 'POST') {
      const examId = pathname.split('/')[3];
      const exam = state.exams.find((entry) => entry.id === examId);
      if (!exam || !canAccessExam(state, user, exam)) {
        await route.fulfill(jsonResponse({ error: 'Access denied' }, 403));
        return;
      }

      const answerMap = (body.answers as Record<string, string> | undefined) ?? {};
      const questions = state.questionsByExam[examId] ?? [];
      const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
      const score = questions.reduce(
        (sum, question) => sum + (answerMap[question.id] === question.correctAnswer ? question.points : 0),
        0
      );
      const attempt = state.attemptsByExam[examId] ?? {
        id: `attempt-${state.nextAttemptId++}`,
        examId,
        studentId: state.users.find((entry) => entry.role === 'Student')?.id ?? 'user-student',
        status: 'Submitted' as const,
        answers: {},
        score: null,
        startedAt: FIXED_NOW,
        submittedAt: FIXED_NOW,
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW,
      };

      attempt.status = 'Submitted';
      attempt.answers = answerMap;
      attempt.score = totalPoints > 0 ? score : 0;
      attempt.submittedAt = FIXED_NOW;
      attempt.updatedAt = FIXED_NOW;
      state.attemptsByExam[examId] = attempt;

      await route.fulfill(jsonResponse({ data: attempt }));
      return;
    }

    await route.fulfill(
      jsonResponse(
        {
          error: `Unhandled mock request: ${method} ${pathname}`,
        },
        404
      )
    );
  });
}

export async function clearAppStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}

export async function seedAuthState(page: Page, user: MockUser, options?: { expiredAccessToken?: boolean }): Promise<void> {
  const tokens = createAuthTokens(user.id);
  const accessToken = options?.expiredAccessToken ? createExpiredAccessToken(user.id) : tokens.accessToken;

  await page.addInitScript(
    ({ accessTokenValue, refreshTokenValue, userValue }) => {
      localStorage.setItem('accessToken', accessTokenValue);
      localStorage.setItem('refreshToken', refreshTokenValue);
      localStorage.setItem('user', JSON.stringify(userValue));
    },
    {
      accessTokenValue: accessToken,
      refreshTokenValue: tokens.refreshToken,
      userValue: user,
    }
  );
}