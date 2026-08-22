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
  Experience,
  VisitorProfile,
  VisitorRole,
} from '../../services/experience';

interface ExperienceRouteCard {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
}

@Component({
  imports: [
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
              'Review validation, database integrity, deployment readiness, and the evidence behind the finished product.',
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

  primaryActionLabel(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return 'Continue to Secure Login';

      case 'recruiter':
        return 'Guided Engineering Tour';

      case 'educator_assessor':
        return 'Evidence Review Tour';

      case 'guest':
        return 'Guided FirstCommit Tour';
    }
  }

  changeVisitorProfile(): void {
    this.experience
      .clearVisitorProfile();

    void this.router
      .navigateByUrl('/');
  }
}