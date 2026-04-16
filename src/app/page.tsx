import Link from 'next/link';
import { ArrowRight, BarChart3, CheckCircle2, FileText, ShieldCheck, Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const highlights = [
  {
    icon: FileText,
    title: 'Course-scoped exams',
    description: 'Organize assessments by course so students only see what applies to them.',
  },
  {
    icon: ShieldCheck,
    title: 'Controlled access',
    description: 'Role-aware navigation keeps admins, instructors, and students in their lane.',
  },
  {
    icon: BarChart3,
    title: 'Clear progress view',
    description: 'Track attempts and review outcomes without jumping between tools.',
  },
];

const steps = [
  'Sign in or create an account.',
  'Browse the exams available to your role.',
  'Open an assessment and start working immediately.',
];

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.06),_transparent_26%),linear-gradient(to_bottom,_rgba(248,250,252,1),_rgba(255,255,255,1))]" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col px-4 py-14 sm:px-6 lg:px-8">
        <section className="grid flex-1 items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <Badge variant="secondary" className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-blue-700">
              Exam management made simple
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Run exams, manage courses, and review results in one place.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Exam System gives students a focused workspace and gives instructors and admins the
                controls they need to create, publish, and review assessments without extra noise.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register" className="gap-2">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <Card key={item.title} className="border-border/60 bg-white/80 shadow-sm backdrop-blur">
                    <CardContent className="space-y-3 p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">{item.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
            <Card className="border-border/60 bg-white/90 shadow-xl shadow-slate-200/60">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Live workspace</p>
                    <h2 className="mt-1 text-2xl font-semibold text-foreground">Exam System</h2>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                    Ready
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/60 bg-slate-50 p-5">
                  {steps.map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="pt-0.5 text-sm leading-6 text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Users2 className="h-4 w-4 text-blue-600" />
                      Roles supported
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Student, instructor, and admin flows share the same interface patterns.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      Secure by default
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Protected pages keep auth checks and redirects in place for signed-in users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-14 grid gap-4 rounded-3xl border border-border/60 bg-white/80 p-6 shadow-sm backdrop-blur sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Built for exam workflows</h2>
            <p className="text-muted-foreground">
              Start with a simple landing page, then move into login, exams, courses, and user
              management with the same clean UI language.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/exams" className="gap-2">
              Go to exams
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
