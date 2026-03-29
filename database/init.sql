-- =============================================================================
-- Quiz Application — PostgreSQL Schema
-- Target: Supabase  (db.pxpfcutxnentcxpnonch.supabase.co / database: postgres)
--
-- Run via psql:
--   psql "postgresql://postgres:[YOUR-PASSWORD]@db.pxpfcutxnentcxpnonch.supabase.co:5432/postgres" \
--        -f database/init.sql
--
-- Or paste directly into the Supabase Dashboard → SQL Editor.
-- =============================================================================

-- Enable pgcrypto for gen_random_uuid() (Postgres < 13 fallback)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. USERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Users" (
    "Id"           UUID          NOT NULL DEFAULT gen_random_uuid(),
    "Name"         VARCHAR(100)  NOT NULL,
    "Email"        VARCHAR(200)  NOT NULL,
    "PasswordHash" TEXT          NOT NULL,
    "Role"         VARCHAR(20)   NOT NULL DEFAULT 'Student'
                                 CHECK ("Role" IN ('Student', 'Teacher')),
    "CreatedAt"    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT "PK_Users" PRIMARY KEY ("Id"),
    CONSTRAINT "UQ_Users_Email" UNIQUE ("Email")
);

CREATE INDEX IF NOT EXISTS "IX_Users_Email" ON "Users" ("Email");

-- ---------------------------------------------------------------------------
-- 2. QUIZZES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Quizzes" (
    "Id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
    "Title"         VARCHAR(200)  NOT NULL,
    "Description"   TEXT          NOT NULL DEFAULT '',
    "TimeLimit"     INT           NOT NULL DEFAULT 30
                                  CHECK ("TimeLimit" BETWEEN 1 AND 180),
    "IsPublished"   BOOLEAN       NOT NULL DEFAULT FALSE,
    "CreatedById"   UUID          NOT NULL,
    "CreatedAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT "PK_Quizzes" PRIMARY KEY ("Id")
    -- NOTE: CreatedById is intentionally not FK-constrained to Users so quizzes
    --       survive teacher account deletion. Add REFERENCES "Users"("Id") if
    --       you want strict referential integrity.
);

CREATE INDEX IF NOT EXISTS "IX_Quizzes_CreatedById"  ON "Quizzes" ("CreatedById");
CREATE INDEX IF NOT EXISTS "IX_Quizzes_IsPublished"  ON "Quizzes" ("IsPublished");

-- ---------------------------------------------------------------------------
-- 3. QUESTIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Questions" (
    "Id"            UUID          NOT NULL DEFAULT gen_random_uuid(),
    "QuizId"        UUID          NOT NULL,
    "Text"          TEXT          NOT NULL,
    "Type"          VARCHAR(30)   NOT NULL DEFAULT 'MultipleChoice'
                                  CHECK ("Type" IN ('MultipleChoice', 'TrueFalse', 'ShortAnswer')),
    "Options"       JSONB         NOT NULL DEFAULT '[]',   -- array of strings
    "CorrectAnswer" TEXT          NOT NULL,
    "Points"        INT           NOT NULL DEFAULT 1
                                  CHECK ("Points" BETWEEN 1 AND 10),
    "OrderIndex"    INT           NOT NULL DEFAULT 0,

    CONSTRAINT "PK_Questions"        PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Questions_Quiz"   FOREIGN KEY ("QuizId")
        REFERENCES "Quizzes" ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_Questions_QuizId" ON "Questions" ("QuizId");

-- ---------------------------------------------------------------------------
-- 4. QUIZ ATTEMPTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "QuizAttempts" (
    "Id"          UUID          NOT NULL DEFAULT gen_random_uuid(),
    "QuizId"      UUID          NOT NULL,
    "UserId"      UUID          NOT NULL,
    "Score"       INT           NOT NULL DEFAULT 0,
    "MaxScore"    INT           NOT NULL DEFAULT 0,
    "StartedAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    "CompletedAt" TIMESTAMPTZ   NULL,
    "IsCompleted" BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT "PK_QuizAttempts"       PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Attempts_Quiz"      FOREIGN KEY ("QuizId")
        REFERENCES "Quizzes" ("Id")  ON DELETE CASCADE,
    CONSTRAINT "FK_Attempts_User"      FOREIGN KEY ("UserId")
        REFERENCES "Users"  ("Id")   ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_QuizAttempts_UserId"      ON "QuizAttempts" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_QuizAttempts_QuizId"      ON "QuizAttempts" ("QuizId");
CREATE INDEX IF NOT EXISTS "IX_QuizAttempts_IsCompleted" ON "QuizAttempts" ("IsCompleted");

-- ---------------------------------------------------------------------------
-- 5. ATTEMPT ANSWERS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "AttemptAnswers" (
    "Id"           UUID     NOT NULL DEFAULT gen_random_uuid(),
    "AttemptId"    UUID     NOT NULL,
    "QuestionId"   UUID     NOT NULL,
    "Answer"       TEXT     NOT NULL DEFAULT '',
    "IsCorrect"    BOOLEAN  NOT NULL DEFAULT FALSE,
    "PointsEarned" INT      NOT NULL DEFAULT 0,

    CONSTRAINT "PK_AttemptAnswers"          PRIMARY KEY ("Id"),
    CONSTRAINT "FK_Answers_Attempt"         FOREIGN KEY ("AttemptId")
        REFERENCES "QuizAttempts" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Answers_Question"        FOREIGN KEY ("QuestionId")
        REFERENCES "Questions"    ("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_AttemptAnswers_AttemptId"  ON "AttemptAnswers" ("AttemptId");
CREATE INDEX IF NOT EXISTS "IX_AttemptAnswers_QuestionId" ON "AttemptAnswers" ("QuestionId");

-- =============================================================================
-- SAMPLE SEED DATA  (comment out for production)
-- =============================================================================

-- Teacher account  (password = "teacher123"  — bcrypt hash)
INSERT INTO "Users" ("Id", "Name", "Email", "PasswordHash", "Role")
VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Demo Teacher',
    'teacher@quiz.app',
    '$2a$11$example_bcrypt_hash_teacher', -- replace with real hash
    'Teacher'
) ON CONFLICT DO NOTHING;

-- Student account  (password = "student123"  — bcrypt hash)
INSERT INTO "Users" ("Id", "Name", "Email", "PasswordHash", "Role")
VALUES (
    'bbbbbbbb-0000-0000-0000-000000000002',
    'Demo Student',
    'student@quiz.app',
    '$2a$11$example_bcrypt_hash_student', -- replace with real hash
    'Student'
) ON CONFLICT DO NOTHING;

-- Sample quiz
INSERT INTO "Quizzes" ("Id", "Title", "Description", "TimeLimit", "IsPublished", "CreatedById")
VALUES (
    'cccccccc-0000-0000-0000-000000000003',
    'General Knowledge',
    'A quick general knowledge quiz.',
    10,
    TRUE,
    'aaaaaaaa-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- Sample questions
INSERT INTO "Questions" ("Id", "QuizId", "Text", "Type", "Options", "CorrectAnswer", "Points", "OrderIndex")
VALUES
(
    'dddddddd-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000003',
    'What is the capital of France?',
    'MultipleChoice',
    '["Paris", "London", "Berlin", "Rome"]',
    'Paris', 1, 0
),
(
    'dddddddd-0000-0000-0000-000000000002',
    'cccccccc-0000-0000-0000-000000000003',
    'The Earth is the third planet from the Sun.',
    'TrueFalse',
    '[]',
    'True', 1, 1
),
(
    'dddddddd-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000003',
    'What is the chemical symbol for water?',
    'ShortAnswer',
    '[]',
    'H2O', 2, 2
)
ON CONFLICT DO NOTHING;
