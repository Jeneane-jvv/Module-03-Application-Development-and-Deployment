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
  MentorGuidance,
  MentorPrompt,
  MissionMentorService,
} from '../../services/mission-mentor-guidance.service';

@Component({
  selector: 'app-mission-mentor',
  styleUrl: './mission-mentor.scss',
  templateUrl: './mission-mentor.html',
})
export class MissionMentor {
  private readonly mentor =
    inject(MissionMentorService);

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
    signal<MentorGuidance | null>(
      null,
    );

  introduction(): string {
    return this.mentor
      .getIntroduction(
        this.visitorRole,
      );
  }

  prompts(): readonly MentorPrompt[] {
    return this.mentor
      .getPrompts(
        this.visitorRole,
      );
  }

  requestGuidance(
    prompt: MentorPrompt,
  ): void {
    const guidance =
      this.mentor
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
          'REQUESTED_MENTOR_GUIDANCE',

        metadata: {
          source:
            'mission-mentor',
          surface:
            'public-experience',
          supportType:
            prompt.id,
        },
      })
      .subscribe({
        error: () => {
          // Optional visitor telemetry must never block
          // Mission Mentor guidance.
        },
      });
  }

  clearGuidance(): void {
    this.selectedPromptId.set(
      null,
    );

    this.guidance.set(
      null,
    );
  }
}