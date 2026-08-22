import {
  Injectable,
} from '@angular/core';

import {
  VisitorRole,
} from './experience';

export type MentorPromptId =
  | 'investigation_strategy'
  | 'evidence_quality'
  | 'competing_causes'
  | 'decision_readiness';

export interface MentorPrompt {
  id: MentorPromptId;
  number: string;
  label: string;
  title: string;
  description: string;
}

export interface MentorGuidance {
  title: string;
  message: string;
  questions: readonly string[];
  boundary: string;
}

@Injectable({
  providedIn: 'root',
})
export class MissionMentorService {
  getIntroduction(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return (
          'Mission Mentor helps you decide what to question, what evidence would be useful, and whether your reasoning is ready to move forward.'
        );

      case 'recruiter':
        return (
          'Mission Mentor demonstrates how FirstCommit supports disciplined investigation without replacing the learner’s technical judgement.'
        );

      case 'educator_assessor':
        return (
          'Mission Mentor demonstrates bounded guidance that supports reasoning development while preserving the learner’s responsibility for the final technical judgement.'
        );

      case 'guest':
        return (
          'Mission Mentor shows how an investigator can be guided toward better questions without being handed the answer.'
        );
    }
  }

  getPrompts(
    role: VisitorRole,
  ): readonly MentorPrompt[] {
    switch (role) {
      case 'learner':
        return [
          {
            id: 'investigation_strategy',
            number: '01',
            label: 'START',
            title:
              'What should I investigate first?',
            description:
              'Use a reasoning nudge to decide which uncertainty should be reduced first.',
          },
          {
            id: 'evidence_quality',
            number: '02',
            label: 'EVIDENCE',
            title:
              'Is this evidence actually useful?',
            description:
              'Check whether an observation proves something or only looks relevant.',
          },
          {
            id: 'competing_causes',
            number: '03',
            label: 'COMPARE',
            title:
              'How should I compare causes?',
            description:
              'Think about what would support or eliminate competing explanations.',
          },
          {
            id: 'decision_readiness',
            number: '04',
            label: 'DECIDE',
            title:
              'Am I ready to conclude?',
            description:
              'Check whether the evidence trail is strong enough for a defensible decision.',
          },
        ];

      case 'recruiter':
        return [
          {
            id: 'investigation_strategy',
            number: '01',
            label: 'STRATEGY',
            title:
              'How does FirstCommit guide investigation?',
            description:
              'See how the product encourages a useful next question without exposing the answer.',
          },
          {
            id: 'evidence_quality',
            number: '02',
            label: 'EVIDENCE',
            title:
              'How is evidence discipline encouraged?',
            description:
              'See how guidance separates useful evidence from assumptions and convenient guesses.',
          },
          {
            id: 'competing_causes',
            number: '03',
            label: 'REASONING',
            title:
              'How are competing explanations handled?',
            description:
              'See how the learner remains responsible for supporting, eliminating, or leaving causes unresolved.',
          },
          {
            id: 'decision_readiness',
            number: '04',
            label: 'DECISION',
            title:
              'What makes a conclusion defensible?',
            description:
              'See the reasoning checks that should happen before the learner commits to a root cause.',
          },
        ];

      case 'educator_assessor':
        return [
          {
            id: 'investigation_strategy',
            number: '01',
            label: 'PROCESS',
            title:
              'How is reasoning scaffolded?',
            description:
              'Inspect the boundary between useful guidance and completing the learner’s work.',
          },
          {
            id: 'evidence_quality',
            number: '02',
            label: 'EVIDENCE',
            title:
              'How is evidence quality challenged?',
            description:
              'See how the mentor prompts the learner to distinguish observation from inference.',
          },
          {
            id: 'competing_causes',
            number: '03',
            label: 'ANALYSIS',
            title:
              'How are alternatives kept visible?',
            description:
              'Inspect how guidance encourages comparison instead of premature closure.',
          },
          {
            id: 'decision_readiness',
            number: '04',
            label: 'JUDGEMENT',
            title:
              'How is independent judgement preserved?',
            description:
              'See how the learner is prompted to justify readiness without receiving a final answer.',
          },
        ];

      case 'guest':
        return [
          {
            id: 'investigation_strategy',
            number: '01',
            label: 'QUESTION',
            title:
              'Where would an investigator begin?',
            description:
              'See the kind of question that helps narrow a software failure.',
          },
          {
            id: 'evidence_quality',
            number: '02',
            label: 'EVIDENCE',
            title:
              'What makes a clue useful?',
            description:
              'See how technical evidence should change what you believe about the incident.',
          },
          {
            id: 'competing_causes',
            number: '03',
            label: 'COMPARE',
            title:
              'Why keep more than one explanation?',
            description:
              'See why engineers compare causes before settling on the most obvious answer.',
          },
          {
            id: 'decision_readiness',
            number: '04',
            label: 'DECISION',
            title:
              'When is a conclusion strong enough?',
            description:
              'See what should connect the final decision back to the evidence.',
          },
        ];
    }
  }

  getGuidance(
    role: VisitorRole,
    promptId: MentorPromptId,
  ): MentorGuidance {
    const sharedBoundary =
      'Mission Mentor can guide the reasoning process, but it does not identify the final root cause, choose a cause assessment, or write the learner’s conclusion.';

    switch (promptId) {
      case 'investigation_strategy':
        return this.investigationStrategy(
          role,
          sharedBoundary,
        );

      case 'evidence_quality':
        return this.evidenceQuality(
          role,
          sharedBoundary,
        );

      case 'competing_causes':
        return this.competingCauses(
          role,
          sharedBoundary,
        );

      case 'decision_readiness':
        return this.decisionReadiness(
          role,
          sharedBoundary,
        );
    }
  }

  private investigationStrategy(
    role: VisitorRole,
    boundary: string,
  ): MentorGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'Reduce the biggest uncertainty first.',
          message:
            'Start with the question that can separate major parts of the system. A useful first step should tell you whether the failure is closer to the frontend, API, database, configuration, or another boundary.',
          questions: [
            'What do you know for certain from the current symptoms?',
            'Which system boundary is still uncertain?',
            'What single piece of evidence would remove the most uncertainty?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'Guidance focuses on the next investigation decision.',
          message:
            'FirstCommit is designed to help the learner choose a useful next question rather than reveal the root cause. The support is therefore about investigation strategy, not answer generation.',
          questions: [
            'Does the prompt help narrow the problem space?',
            'Does the learner still need to inspect evidence?',
            'Would the learner remain responsible for the technical conclusion?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Scaffolding should expose the reasoning process.',
          message:
            'The mentor prompts the learner to identify uncertainty and choose evidence that can reduce it. This preserves observable reasoning evidence instead of replacing it with an answer.',
          questions: [
            'Is the learner required to articulate what remains uncertain?',
            'Does the next action produce assessable reasoning evidence?',
            'Is the learner still responsible for the judgement?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'Begin with what you need to know next.',
          message:
            'A strong investigation starts by turning a vague failure into a useful technical question. The next clue should help separate possible explanations.',
          questions: [
            'What is the system actually doing?',
            'What part of the system is still uncertain?',
            'What evidence could rule something in or out?',
          ],
          boundary,
        };
    }
  }

  private evidenceQuality(
    role: VisitorRole,
    boundary: string,
  ): MentorGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'Ask what the evidence proves.',
          message:
            'Useful evidence changes the probability of one or more explanations. A log line, request, response, configuration value, or database result matters because of what it supports or eliminates.',
          questions: [
            'What exact claim does this evidence support?',
            'Which competing cause becomes less likely because of it?',
            'Are you observing a fact or adding an assumption?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'The product rewards evidence-linked reasoning.',
          message:
            'The mentor does not treat every technical detail as equally useful. It encourages the learner to explain what a finding proves and how it changes the investigation.',
          questions: [
            'Is the evidence tied to a specific technical claim?',
            'Can the learner explain why the evidence matters?',
            'Does the workflow discourage unsupported guessing?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Observation and inference remain distinguishable.',
          message:
            'The guidance encourages the learner to separate what the evidence directly shows from what they infer from it. That distinction strengthens the assessability of the reasoning.',
          questions: [
            'What is directly observable?',
            'What conclusion is being inferred?',
            'Is the inference justified by the available evidence?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'A clue is useful when it changes the investigation.',
          message:
            'Technical evidence should help you support, weaken, or eliminate an explanation. A detail that changes nothing may be interesting without being useful.',
          questions: [
            'What does this clue show?',
            'Which explanation does it affect?',
            'What would you investigate next because of it?',
          ],
          boundary,
        };
    }
  }

  private competingCauses(
    role: VisitorRole,
    boundary: string,
  ): MentorGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'Compare causes against the same evidence.',
          message:
            'Do not ask only whether your preferred cause can explain the symptoms. Ask whether the evidence also fits competing causes and what would distinguish them.',
          questions: [
            'What evidence would have to be true if this cause were correct?',
            'What evidence would contradict this cause?',
            'Which alternative explanation still fits the facts?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'The learner must close alternatives deliberately.',
          message:
            'FirstCommit keeps competing causes visible so the learner cannot simply select the first plausible explanation. Each assessment requires an explicit reasoning decision.',
          questions: [
            'Can the learner explain why a cause is supported or eliminated?',
            'Are unresolved causes allowed to remain unresolved?',
            'Does the workflow preserve the learner’s decision trail?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Alternative hypotheses remain part of the evidence trail.',
          message:
            'The mentor encourages comparison rather than premature closure. The persisted assessment states make that analytical process visible for later review.',
          questions: [
            'Were competing explanations considered?',
            'Is each assessment connected to reasoning?',
            'Does the learner acknowledge uncertainty when evidence is incomplete?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'The obvious answer is not automatically the right answer.',
          message:
            'Engineers keep more than one explanation alive until the evidence separates them. This reduces the risk of fixing the wrong thing for the right-looking reason.',
          questions: [
            'What other cause could produce the same symptom?',
            'What clue would separate the two explanations?',
            'Which explanation currently has stronger evidence?',
          ],
          boundary,
        };
    }
  }

  private decisionReadiness(
    role: VisitorRole,
    boundary: string,
  ): MentorGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'A conclusion should be traceable back to evidence.',
          message:
            'Before concluding, check that your strongest cause is supported, important alternatives are addressed, and your recommended action actually follows from the technical finding.',
          questions: [
            'Which evidence most strongly supports your conclusion?',
            'Which competing causes have you eliminated or left unresolved?',
            'Does your recommended action directly address the identified cause?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'The decision gate protects against answer-first behaviour.',
          message:
            'A defensible conclusion is expected to follow an evidence trail, competing-cause analysis, and a technically relevant recommended action.',
          questions: [
            'Can the conclusion be traced to recorded evidence?',
            'Were realistic alternatives considered?',
            'Does the recommended action address the diagnosed problem?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Independent judgement remains visible at the decision point.',
          message:
            'The mentor can ask whether the evidence is sufficient, but the learner must still state the technical conclusion and justify it from the persisted investigation record.',
          questions: [
            'Is the judgement supported by prior reasoning?',
            'Are unresolved uncertainties acknowledged?',
            'Can the reviewer trace the conclusion back through the evidence?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'A strong decision explains why it follows from the evidence.',
          message:
            'The final answer should not feel like a guess at the end of the process. Someone else should be able to follow the evidence and understand how the conclusion was reached.',
          questions: [
            'What evidence points most strongly to the conclusion?',
            'What alternatives have been ruled out?',
            'Would another person be able to follow the reasoning?',
          ],
          boundary,
        };
    }
  }
}