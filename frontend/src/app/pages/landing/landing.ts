import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  RouterLink,
} from '@angular/router';

import {
  Experience,
  VisitorProfile,
  VisitorRole,
} from '../../services/experience';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  selector: 'app-landing',
  styleUrl: './landing.scss',
  templateUrl: './landing.html',
})
export class Landing implements OnInit {
  private readonly experience =
    inject(Experience);

  readonly visitorProfile =
    signal<VisitorProfile | null>(
      null,
    );

  readonly isEntering =
    signal(false);

  readonly entranceError =
    signal<string | null>(
      null,
    );

  readonly entranceForm =
    new FormGroup({
      displayName:
        new FormControl(
          '',
          {
            nonNullable: true,
            validators: [
              Validators.required,
              Validators.maxLength(80),
            ],
          },
        ),

      visitorRole:
        new FormControl<
          VisitorRole | null
        >(
          null,
          {
            validators: [
              Validators.required,
            ],
          },
        ),

      consentGiven:
        new FormControl(
          false,
          {
            nonNullable: true,
          },
        ),
    });

  ngOnInit(): void {
    const existingProfile =
      this.experience
        .getVisitorProfile();

    if (existingProfile) {
      this.visitorProfile.set(
        existingProfile,
      );
    }
  }

  enterMissionControl(): void {
    if (
      this.entranceForm.invalid ||
      this.isEntering()
    ) {
      this.entranceForm
        .markAllAsTouched();

      return;
    }

    const displayName =
      this.entranceForm.controls
        .displayName.value.trim();

    const visitorRole =
      this.entranceForm.controls
        .visitorRole.value;

    const consentGiven =
      this.entranceForm.controls
        .consentGiven.value;

    if (!visitorRole) {
      return;
    }

    this.isEntering.set(true);
    this.entranceError.set(null);

    this.experience
      .createVisitorProfile(
        displayName,
        visitorRole,
        consentGiven,
      )
      .subscribe({
        next: (profile) => {
          this.visitorProfile.set(
            profile,
          );

          this.isEntering.set(false);

          this.experience
            .recordEvent({
              eventType:
                'ENTERED_MISSION_CONTROL',

              metadata: {
                source:
                  'landing',

                surface:
                  'public',
              },
            })
            .subscribe({
              error: () => {
                // Visitor entry remains available even if
                // optional telemetry cannot be recorded.
              },
            });
        },

        error: (error) => {
          this.isEntering.set(false);

          this.entranceError.set(
            error.error?.message ??
              'Mission Control could not create your visitor experience.',
          );
        },
      });
  }

  changeVisitorProfile(): void {
    this.experience
      .clearVisitorProfile();

    this.visitorProfile.set(
      null,
    );

    this.entranceError.set(
      null,
    );

    this.entranceForm.reset({
      displayName: '',
      visitorRole: null,
      consentGiven: false,
    });
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

  roleWelcome(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return (
          'Your Mission Control profile is ready. Continue to secure access to begin or resume an engineering investigation.'
        );

      case 'recruiter':
        return (
          'Your recruiter profile is ready. FirstCommit can use this role to guide you toward the engineering decisions, workflows, and evidence behind the project.'
        );

      case 'educator_assessor':
        return (
          'Your assessor profile is ready. FirstCommit can use this role to foreground the learning evidence, technical workflow, and implementation decisions.'
        );

      case 'guest':
        return (
          'Your guest profile is ready. You can explore FirstCommit as an engineering investigation experience.'
        );
    }
  }


  continueRoute(
    role: VisitorRole,
  ): string {
    if (role === 'learner') {
      return '/login';
    }

    return '/explore';
  }

  continueLabel(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return 'Continue to Secure Access';

      case 'recruiter':
        return 'Explore FirstCommit';

      case 'educator_assessor':
        return 'Inspect Project Evidence';

      case 'guest':
        return 'Explore Mission Control';
    }
  }
}