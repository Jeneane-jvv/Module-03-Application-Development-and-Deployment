import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  ErrorAnalyst,
} from '../../components/error-analyst/error-analyst';

import {
  MissionMentor,
} from '../../components/mission-mentor/mission-mentor';

import {
  Experience,
  VisitorEventType,
  VisitorProfile,
  VisitorRole,
} from '../../services/experience';

interface ExperienceRouteCard {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}

interface GuidedTourStep {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  evidence: readonly string[];
}

@Component({
  imports: [
    ErrorAnalyst,
    MissionMentor,
    RouterLink,
  ],
  selector: 'app-public-experience',
  styleUrl: './public-experience.scss',
  templateUrl: './public-experience.html',
})
export class PublicExperience
  implements OnInit {
  private readonly experience =
    inject(Experience);

  private readonly router =
    inject(Router);

  readonly visitorProfile =
    signal<VisitorProfile | null>(
      null,
    );

  readonly tourOpen =
    signal(false);

  readonly tourStepIndex =
    signal(0);

  readonly tourCompleted =
    signal(false);

  ngOnInit(): void {
    this.visitorProfile.set(
      this.experience
        .getVisitorProfile(),
    );
  }

  roleLabel(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return 'Learner';

      case 'recruiter':
        return 'Recruiter / Portfolio Reviewer';

      case 'educator_assessor':
        return 'Educator / Assessor';

      case 'guest':
        return 'Guest';
    }
  }

  roleEyebrow(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return 'SECURE LEARNER ROUTE';

      case 'recruiter':
        return 'PORTFOLIO REVIEW ROUTE';

      case 'educator_assessor':
        return 'EVIDENCE REVIEW ROUTE';

      case 'guest':
        return 'PUBLIC EXPLORATION ROUTE';
    }
  }

  roleTitle(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return (
          'Your investigation workspace is protected.'
        );

      case 'recruiter':
        return (
          'Explore the engineering behind FirstCommit.'
        );

      case 'educator_assessor':
        return (
          'Inspect the learning evidence and implementation.'
        );

      case 'guest':
        return (
          'Explore how FirstCommit turns evidence into decisions.'
        );
    }
  }

  roleIntroduction(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return (
          'Learner missions remain behind secure authentication so investigation progress, submissions, and feedback stay tied to the correct account.'
        );

      case 'recruiter':
        return (
          'This public route is designed to show the complete product thinking without requiring you to impersonate a learner or reviewer.'
        );

      case 'educator_assessor':
        return (
          'This public route foregrounds the learning workflow, technical implementation, and evidence trail that support assessment of the project.'
        );

      case 'guest':
        return (
          'This public route introduces the investigation model and the engineering decisions that make the FirstCommit experience work.'
        );
    }
  }

  routeCards(
    role: VisitorRole,
  ): readonly ExperienceRouteCard[] {
    switch (role) {
      case 'learner':
        return [
          {
            number: '01',
            eyebrow: 'INVESTIGATE',
            title:
              'Protected mission workspace',
            description:
              'Start or resume a mission through the authenticated learner experience.',
          },
          {
            number: '02',
            eyebrow: 'REASON',
            title:
              'Evidence-driven decisions',
            description:
              'Record observations, assess competing causes, and build a technical conclusion.',
          },
          {
            number: '03',
            eyebrow: 'REVIEW',
            title:
              'Reviewer feedback lifecycle',
            description:
              'Submit completed reasoning and receive structured reviewer feedback.',
          },
        ];

      case 'recruiter':
        return [
          {
            number: '01',
            eyebrow: 'PRODUCT',
            title:
              'End-to-end workflow',
            description:
              'Follow how a realistic incident moves from investigation through technical conclusion and review.',
          },
          {
            number: '02',
            eyebrow: 'ENGINEERING',
            title:
              'Architecture and decisions',
            description:
              'See how Angular, Express, PostgreSQL, authentication, state, and auditability work together.',
          },
          {
            number: '03',
            eyebrow: 'DELIVERY',
            title:
              'Implementation evidence',
            description:
              'Review validation, database integrity, deployment planning, and the evidence behind the working product.',
          },
        ];

      case 'educator_assessor':
        return [
          {
            number: '01',
            eyebrow: 'LEARNING',
            title:
              'Reasoning evidence',
            description:
              'Inspect how observations, evidence selection, cause assessment, and final reasoning are captured.',
          },
          {
            number: '02',
            eyebrow: 'IMPLEMENTATION',
            title:
              'Technical evidence',
            description:
              'Review the application structure, API workflow, relational database design, and security boundaries.',
          },
          {
            number: '03',
            eyebrow: 'TRACEABILITY',
            title:
              'Assessment trail',
            description:
              'See how submissions, reviewer feedback, timestamps, and audit events support traceable evidence.',
          },
        ];

      case 'guest':
        return [
          {
            number: '01',
            eyebrow: 'QUESTION',
            title:
              'Start with the incident',
            description:
              'Understand the software failure before assuming what the fix should be.',
          },
          {
            number: '02',
            eyebrow: 'EVIDENCE',
            title:
              'Follow the technical clues',
            description:
              'See how observations and evidence narrow competing explanations.',
          },
          {
            number: '03',
            eyebrow: 'DECISION',
            title:
              'Reach a defensible conclusion',
            description:
              'Connect evidence to a technical decision instead of relying on guesswork.',
          },
        ];
    }
  }

  guidedTourSteps(
    role: VisitorRole,
  ): readonly GuidedTourStep[] {
    switch (role) {
      case 'learner':
        return [];

      case 'recruiter':
        return [
          {
            number: '01',
            eyebrow: 'PRODUCT PROBLEM',
            title:
              'Why FirstCommit exists',
            description:
              'FirstCommit turns realistic software failures into structured engineering investigations. The learner is expected to build a conclusion from evidence instead of guessing the fix.',
            evidence: [
              'Realistic incident scenarios',
              'Progressive evidence discovery',
              'Question → Evidence → Decision',
            ],
          },
          {
            number: '02',
            eyebrow: 'WORKFLOW',
            title:
              'A complete investigation lifecycle',
            description:
              'The product records observations, reasoning, competing-cause assessments, a final technical conclusion, submission, and reviewer feedback as one traceable workflow.',
            evidence: [
              'Investigation steps',
              'Cause assessments',
              'Submission and review states',
            ],
          },
          {
            number: '03',
            eyebrow: 'FULL STACK',
            title:
              'Angular, Express, and PostgreSQL',
            description:
              'The frontend manages the interactive mission experience, Express provides the application API, and PostgreSQL persists the relational evidence and workflow state.',
            evidence: [
              'Angular frontend',
              'Node / Express API',
              'PostgreSQL relational persistence',
            ],
          },
          {
            number: '04',
            eyebrow: 'SECURITY + STATE',
            title:
              'Operational access stays protected',
            description:
              'Learner and reviewer workflows remain authenticated. Public portfolio exploration is intentionally read-only and separate from operational access.',
            evidence: [
              'JWT authentication',
              'bcrypt password hashing',
              'Role guards and parameterized SQL',
            ],
          },
          {
            number: '05',
            eyebrow: 'AUDITABILITY',
            title:
              'The engineering trail is persisted',
            description:
              'Reasoning steps, current cause assessments, reviewer feedback, timestamps, and audit events provide evidence of what happened throughout the mission lifecycle.',
            evidence: [
              'Reviewer feedback',
              'Audit events',
              'Validated database constraints',
            ],
          },
          {
            number: '06',
            eyebrow: 'DELIVERY PATH',
            title:
              'Local validation before production deployment',
            description:
              'The application is validated locally first. The remaining Module 03 delivery milestone is production configuration and deployment of the database, API, and Angular frontend to hosted services.',
            evidence: [
              'Local end-to-end validation',
              'Live PostgreSQL backup and restore proof',
              'Azure deployment is the next delivery milestone',
            ],
          },
        ];

      case 'educator_assessor':
        return [
          {
            number: '01',
            eyebrow: 'LEARNING INTENT',
            title:
              'Reasoning is visible, not hidden',
            description:
              'The learner records what was observed, why it matters, and what should be investigated next rather than submitting only a final answer.',
            evidence: [
              'Ordered investigation steps',
              'Observation and reasoning fields',
              'Evidence references',
            ],
          },
          {
            number: '02',
            eyebrow: 'EVIDENCE USE',
            title:
              'Competing causes are assessed explicitly',
            description:
              'Each probable cause can be supported, eliminated, or left unresolved, with reasoning that remains part of the persisted investigation record.',
            evidence: [
              'Cause options',
              'Cause assessments',
              'Reasoning required for assessment',
            ],
          },
          {
            number: '03',
            eyebrow: 'DATABASE DESIGN',
            title:
              'Relational integrity supports the workflow',
            description:
              'PostgreSQL links users, scenarios, attempts, evidence, reasoning, causes, feedback, audit events, and consent-aware visitor activity through enforced relationships.',
            evidence: [
              '11 live application tables',
              'Foreign-key relationships',
              'Validated checks, keys, and indexes',
            ],
          },
          {
            number: '04',
            eyebrow: 'APPLICATION SECURITY',
            title:
              'Roles and operational boundaries are explicit',
            description:
              'Learner and reviewer actions require authenticated role access, while the portfolio exploration route remains public and read-only.',
            evidence: [
              'JWT authentication',
              'Learner and reviewer route guards',
              'Public role-aware exploration',
            ],
          },
          {
            number: '05',
            eyebrow: 'TRACEABILITY',
            title:
              'Review outcomes are connected to evidence',
            description:
              'Submitted investigations can be reviewed once, with structured ratings, written feedback, timestamps, and an auditable review event.',
            evidence: [
              'Structured feedback ratings',
              'Reviewed workflow state',
              'MISSION_REVIEWED audit event',
            ],
          },
          {
            number: '06',
            eyebrow: 'DELIVERY EVIDENCE',
            title:
              'The project is moving from local proof to hosted proof',
            description:
              'Local application and database behaviour have been validated. Hosted deployment and production verification remain the final Module 03 delivery evidence.',
            evidence: [
              'Local functional validation',
              'Database backup and restore verification',
              'Hosted deployment remains to be completed',
            ],
          },
        ];

      case 'guest':
        return [
          {
            number: '01',
            eyebrow: 'THE INCIDENT',
            title:
              'A software failure becomes a mission',
            description:
              'Instead of presenting a coding exercise, FirstCommit begins with a realistic technical problem that needs to be investigated.',
            evidence: [
              'Scenario context',
              'Technical symptoms',
              'A clear investigation objective',
            ],
          },
          {
            number: '02',
            eyebrow: 'QUESTION',
            title:
              'Start by asking what the evidence must prove',
            description:
              'The experience encourages the investigator to identify useful questions before jumping to a preferred fix.',
            evidence: [
              'Structured reasoning',
              'Investigation sequence',
              'No answer-first workflow',
            ],
          },
          {
            number: '03',
            eyebrow: 'EVIDENCE',
            title:
              'Technical clues narrow the possibilities',
            description:
              'Evidence is opened and interpreted progressively so competing explanations can be compared against what the system actually shows.',
            evidence: [
              'Evidence items',
              'Observations',
              'Competing causes',
            ],
          },
          {
            number: '04',
            eyebrow: 'DECISION',
            title:
              'The conclusion must follow the investigation',
            description:
              'A final technical conclusion is recorded only after the learner has built an evidence trail and assessed the probable causes.',
            evidence: [
              'Probable root cause',
              'Final reasoning',
              'Recommended action',
            ],
          },
          {
            number: '05',
            eyebrow: 'REVIEW',
            title:
              'A reviewer can evaluate the reasoning',
            description:
              'The completed investigation moves into a separate reviewer workflow with structured ratings and written feedback.',
            evidence: [
              'Submission state',
              'Reviewer assessment',
              'Learner feedback view',
            ],
          },
          {
            number: '06',
            eyebrow: 'BEHIND THE SCENES',
            title:
              'The experience is backed by a real full-stack application',
            description:
              'Angular, Express, and PostgreSQL work together to persist the mission lifecycle while protected routes keep operational access separate from this public tour.',
            evidence: [
              'Angular interface',
              'Express API',
              'PostgreSQL database',
            ],
          },
        ];
    }
  }

  currentTourStep(
    role: VisitorRole,
  ): GuidedTourStep | null {
    const steps =
      this.guidedTourSteps(role);

    return (
      steps[this.tourStepIndex()] ??
      null
    );
  }

  guidedTourLabel(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return '';

      case 'recruiter':
        return 'Start Guided Engineering Tour';

      case 'educator_assessor':
        return 'Start Evidence Review Tour';

      case 'guest':
        return 'Start Guided FirstCommit Tour';
    }
  }

  tourCompletionTitle(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return '';

      case 'recruiter':
        return (
          'You have completed the engineering overview.'
        );

      case 'educator_assessor':
        return (
          'You have completed the evidence overview.'
        );

      case 'guest':
        return (
          'You have completed the FirstCommit overview.'
        );
    }
  }

  startGuidedTour(
    role: VisitorRole,
  ): void {
    if (role === 'learner') {
      return;
    }

    this.tourStepIndex.set(0);
    this.tourCompleted.set(false);
    this.tourOpen.set(true);

    this.recordTourEvent(
      'STARTED_GUIDED_TOUR',
      '1',
    );
  }

  previousTourStep(): void {
    if (
      this.tourCompleted() ||
      this.tourStepIndex() === 0
    ) {
      return;
    }

    this.tourStepIndex.update(
      (index) => index - 1,
    );
  }

  nextTourStep(
    role: VisitorRole,
  ): void {
    if (this.tourCompleted()) {
      return;
    }

    const steps =
      this.guidedTourSteps(role);

    const finalIndex =
      steps.length - 1;

    if (
      this.tourStepIndex() <
      finalIndex
    ) {
      this.tourStepIndex.update(
        (index) => index + 1,
      );

      return;
    }

    this.completeGuidedTour(
      role,
    );
  }

  completeGuidedTour(
    role: VisitorRole,
  ): void {
    if (
      role === 'learner' ||
      this.tourCompleted()
    ) {
      return;
    }

    const steps =
      this.guidedTourSteps(role);

    this.tourCompleted.set(true);

    this.recordTourEvent(
      'COMPLETED_GUIDED_TOUR',
      String(steps.length),
    );
  }

  restartGuidedTour(
    role: VisitorRole,
  ): void {
    this.startGuidedTour(
      role,
    );
  }

  closeGuidedTour(): void {
    this.tourOpen.set(false);
    this.tourCompleted.set(false);
    this.tourStepIndex.set(0);
  }

  changeVisitorProfile(): void {
    this.experience
      .clearVisitorProfile();

    void this.router
      .navigateByUrl('/');
  }

  private recordTourEvent(
    eventType: VisitorEventType,
    tourStep: string,
  ): void {
    this.experience
      .recordEvent({
        eventType,
        metadata: {
          source:
            'public-experience',
          surface:
            'guided-tour',
          tourStep,
        },
      })
      .subscribe({
        error: () => {
          // Optional visitor telemetry must never block
          // the public experience.
        },
      });
  }
}