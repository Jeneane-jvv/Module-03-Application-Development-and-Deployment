import {
  Component,
  inject,
  Input,
  signal,
} from '@angular/core';

import {
  Experience,
  VisitorRole,
} from '../../services/experience';

import {
  ErrorAnalystGuidance,
  ErrorAnalystGuidanceService,
  ErrorAnalystPrompt,
} from '../../services/error-analyst-guidance.service';

@Component({
  selector: 'app-error-analyst',
  styleUrl: './error-analyst.scss',
  templateUrl: './error-analyst.html',
})
export class ErrorAnalyst {
  private readonly analyst =
    inject(ErrorAnalystGuidanceService);

  private readonly experience =
    inject(Experience);

  @Input({
    required: true,
  })
  visitorRole!: VisitorRole;

  readonly selectedPromptId =
    signal<string | null>(
      null,
    );

  readonly guidance =
    signal<ErrorAnalystGuidance | null>(
      null,
    );

  introduction(): string {
    return this.analyst
      .getIntroduction(
        this.visitorRole,
      );
  }

  prompts(): readonly ErrorAnalystPrompt[] {
    return this.analyst
      .getPrompts(
        this.visitorRole,
      );
  }

  requestAnalysis(
    prompt: ErrorAnalystPrompt,
  ): void {
    const guidance =
      this.analyst
        .getGuidance(
          this.visitorRole,
          prompt.id,
        );

    this.selectedPromptId.set(
      prompt.id,
    );

    this.guidance.set(
      guidance,
    );

    this.experience
      .recordEvent({
        eventType:
          'REQUESTED_ERROR_ANALYSIS',

        metadata: {
          source:
            'error-analyst',
          surface:
            'public-experience',
          supportType:
            prompt.id,
        },
      })
      .subscribe({
        error: () => {
          // Optional visitor telemetry must never block
          // Error Analyst guidance.
        },
      });
  }

  clearAnalysis(): void {
    this.selectedPromptId.set(
      null,
    );

    this.guidance.set(
      null,
    );
  }
}