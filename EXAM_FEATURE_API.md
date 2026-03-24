# Exam Feature API Guide

This document explains the new exam-related backend changes and the HTTP routes the frontend can use.

## What Was Added

### Database Models
- `Exam`
- `Question`
- `ExamAttempt`

### New enums
- `ExamStatus`: `Draft`, `Published`, `Closed`
- `QuestionType`: `MCQ`, `TrueFalse`
- `AttemptStatus`: `InProgress`, `Submitted`

## Data Model Summary

### Exam
An exam belongs to one instructor.

Fields:
- `id`
- `title`
- `description`
- `instructorId`
- `durationMinutes`
- `availabilityStart`
- `availabilityEnd`
- `status`
- `createdAt`
- `updatedAt`

### Question
A question belongs to one exam.

Fields:
- `id`
- `examId`
- `order`
- `type`
- `questionText`
- `options`
- `correctAnswer`
- `points`
- `createdAt`
- `updatedAt`

Notes:
- `options` is an array of strings.
- `correctAnswer` is stored as a string.
- Questions are ordered by `order`.
- `order` is unique per exam.

### ExamAttempt
An attempt belongs to one exam and one student.

Fields:
- `id`
- `examId`
- `studentId`
- `status`
- `answers`
- `score`
- `startedAt`
- `submittedAt`
- `createdAt`
- `updatedAt`

Notes:
- One attempt per student per exam is enforced.
- `answers` is stored as JSON.
- `score` is calculated when the student submits.

## Authentication

All protected routes require an access token in the header:

```http
Authorization: Bearer <accessToken>
```

## Role Rules

- `Admin` can manage all exams and questions.
- `Instructor` can manage exams they own.
- `Student` can view published exams, start attempts, and submit answers.

## API Routes

## Exams

### Get all exams
`GET /api/exams`

Behavior:
- `Admin`: sees all exams.
- `Instructor`: sees only their own exams.
- `Student`: sees only published exams.

Response:
```json
{
  "success": true,
  "data": []
}
```

### Get one exam
`GET /api/exams/:id`

Behavior:
- `Student`: only allowed if the exam is published.
- `Instructor`: only allowed for exams they own, unless they are `Admin`.

### Create exam
`POST /api/exams`

Allowed roles:
- `Instructor`
- `Admin`

Request body:
```json
{
  "title": "Midterm Exam",
  "description": "Chapter 1 to 5",
  "durationMinutes": 60,
  "availabilityStart": "2026-03-25T08:00:00.000Z",
  "availabilityEnd": "2026-03-25T10:00:00.000Z",
  "status": "Draft"
}
```

Admin only optional field:
- `instructorId`

If `instructorId` is not provided by an admin, the exam is assigned to the authenticated instructor.

### Update exam
`PATCH /api/exams/:id`

Allowed roles:
- `Instructor`
- `Admin`

Request body can include:
- `title`
- `description`
- `durationMinutes`
- `availabilityStart`
- `availabilityEnd`
- `status`

### Delete exam
`DELETE /api/exams/:id`

Allowed roles:
- `Instructor`
- `Admin`

Behavior:
- Instructors can only delete their own exams.

## Nested Question Management

Question management is exposed under each exam:

- `GET /api/exams/:id/questions`
- `POST /api/exams/:id/questions`
- `PATCH /api/exams/:id/questions/:questionId`
- `DELETE /api/exams/:id/questions/:questionId`

### Get questions for an exam
`GET /api/exams/:id/questions`

Behavior:
- `Student`: only if exam is published.
- `Instructor`: only for exams they own.
- `Admin`: allowed.

Response:
```json
{
  "success": true,
  "data": []
}
```

### Create question
`POST /api/exams/:id/questions`

Allowed roles:
- `Instructor`
- `Admin`

Request body:
```json
{
  "order": 1,
  "type": "MCQ",
  "questionText": "What is 2 + 2?",
  "options": ["1", "2", "3", "4"],
  "correctAnswer": "4",
  "points": 1
}
```

Notes:
- `order` must be unique for the exam.
- `options` should contain the possible answers.
- For `TrueFalse`, the frontend can still send `options` such as `["True", "False"]`.

### Update question
`PATCH /api/exams/:id/questions/:questionId`

Allowed roles:
- `Instructor`
- `Admin`

Request body can include:
- `order`
- `type`
- `questionText`
- `options`
- `correctAnswer`
- `points`

### Delete question
`DELETE /api/exams/:id/questions/:questionId`

Allowed roles:
- `Instructor`
- `Admin`

Behavior:
- Instructors can only delete questions from exams they own.

## Student Exam Flow

### Start exam attempt
`POST /api/exams/:id/start`

Allowed roles:
- `Student`

Behavior:
- Exam must be `Published`.
- The current time must be inside the availability window if one is set.
- A student can only start one attempt per exam.

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "examId": 5,
    "studentId": 12,
    "status": "InProgress"
  }
}
```

### Submit exam attempt
`POST /api/exams/:id/submit`

Allowed roles:
- `Student`

Request body:
```json
{
  "answers": {
    "1": "4",
    "2": "True"
  }
}
```

Notes:
- Keys in `answers` should match question IDs as strings.
- Score is calculated automatically on submit.
- The backend uses the attempt for that student and exam.

Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "examId": 5,
    "studentId": 12,
    "status": "Submitted",
    "score": 8
  }
}
```

## Frontend Implementation Notes

### Suggested UI screens
- Exam list page
- Exam detail page
- Instructor exam creation page
- Instructor question editor page
- Student exam taking page
- Student results page

### Recommended flow
1. Instructor creates an exam in `Draft`.
2. Instructor adds questions under `/api/exams/:id/questions`.
3. Instructor publishes the exam by updating `status` to `Published`.
4. Student sees the exam in their list.
5. Student starts the exam with `POST /api/exams/:id/start`.
6. Student submits answers with `POST /api/exams/:id/submit`.

### Suggested frontend state to keep
- current exam
- question list
- current attempt
- timer start time
- selected answers
- submission state

## Error Format
Most routes return errors in this shape:

```json
{
  "error": "Message here"
}
```

Common examples:
- `Invalid exam ID`
- `Exam not found`
- `Access denied`
- `Exam is not available`
- `Attempt already submitted`

## Implementation Status

The backend routes and services are already wired for:
- exam CRUD
- nested question CRUD
- student start/submit flow
- role-based access control

The remaining work is primarily frontend integration and any UI-specific validation you want to add on top of these routes.
