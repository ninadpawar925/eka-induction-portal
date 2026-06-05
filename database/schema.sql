create table if not exists inductions (
  id uuid primary key,
  reference_number varchar(8) not null unique,
  language varchar(20) not null check (language in ('English', 'Hindi')),
  full_name varchar(120) not null,
  employee_id varchar(60) not null,
  designation varchar(120) not null,
  department varchar(120) not null,
  date_of_joining date not null,
  phone varchar(10) not null check (phone ~ '^[0-9]{10}$'),
  quiz_score integer not null check (quiz_score >= 0),
  total_questions integer not null check (total_questions > 0),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (quiz_score <= total_questions)
);

create index if not exists inductions_employee_id_idx
  on inductions (employee_id);

create index if not exists inductions_completed_at_idx
  on inductions (completed_at desc);
