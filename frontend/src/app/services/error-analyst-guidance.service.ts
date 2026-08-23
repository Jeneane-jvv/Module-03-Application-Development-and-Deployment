import {
  Injectable,
} from '@angular/core';

import {
  VisitorRole,
} from './experience';

export type ErrorAnalystPromptId =
  | 'error_signal'
  | 'request_response'
  | 'configuration_clue'
  | 'evidence_comparison';

export interface ErrorAnalystPrompt {
  id: ErrorAnalystPromptId;
  number: string;
  label: string;
  title: string;
  description: string;
}

export interface ErrorAnalystGuidance {
  title: string;
  message: string;
  checks: readonly string[];
  boundary: string;
}

@Injectable({
  providedIn: 'root',
})
export class ErrorAnalystGuidanceService {
  getIntroduction(
    role: VisitorRole,
  ): string {
    switch (role) {
      case 'learner':
        return (
          'Error Analyst helps you interpret technical signals such as errors, requests, responses, and configuration clues without deciding the root cause for you.'
        );

      case 'recruiter':
        return (
          'Error Analyst demonstrates how FirstCommit helps a learner interpret technical evidence without fabricating findings or replacing engineering judgement.'
        );

      case 'educator_assessor':
        return (
          'Error Analyst demonstrates bounded evidence interpretation that keeps observations separate from conclusions and preserves the learner’s independent judgement.'
        );

      case 'guest':
        return (
          'Error Analyst shows how engineers read technical clues carefully before deciding what they mean.'
        );
    }
  }

  getPrompts(
    role: VisitorRole,
  ): readonly ErrorAnalystPrompt[] {
    switch (role) {
      case 'learner':
        return [
          {
            id: 'error_signal',
            number: '01',
            label: 'ERROR',
            title:
              'What is this error actually telling me?',
            description:
              'Separate the literal error signal from assumptions about its cause.',
          },
          {
            id: 'request_response',
            number: '02',
            label: 'REQUEST',
            title:
              'What should I inspect in the request and response?',
            description:
              'Use network behaviour to determine where the failure is occurring.',
          },
          {
            id: 'configuration_clue',
            number: '03',
            label: 'CONFIG',
            title:
              'How should I interpret a configuration clue?',
            description:
              'Compare runtime behaviour with the configuration that is supposed to control it.',
          },
          {
            id: 'evidence_comparison',
            number: '04',
            label: 'COMPARE',
            title:
              'How do these technical clues fit together?',
            description:
              'Compare multiple observations before deciding what they collectively support.',
          },
        ];

      case 'recruiter':
        return [
          {
            id: 'error_signal',
            number: '01',
            label: 'SIGNAL',
            title:
              'How does FirstCommit interpret errors safely?',
            description:
              'See how the product distinguishes an observed error from a guessed root cause.',
          },
          {
            id: 'request_response',
            number: '02',
            label: 'NETWORK',
            title:
              'How are request and response clues used?',
            description:
              'See how network evidence helps narrow where the failure occurs.',
          },
          {
            id: 'configuration_clue',
            number: '03',
            label: 'CONFIG',
            title:
              'How are configuration clues evaluated?',
            description:
              'See how runtime behaviour is compared with intended configuration.',
          },
          {
            id: 'evidence_comparison',
            number: '04',
            label: 'SYNTHESIS',
            title:
              'How does the learner combine technical evidence?',
            description:
              'See how multiple clues can support a conclusion without the tool deciding it.',
          },
        ];

      case 'educator_assessor':
        return [
          {
            id: 'error_signal',
            number: '01',
            label: 'OBSERVE',
            title:
              'How is observation separated from diagnosis?',
            description:
              'Inspect how the analyst keeps the literal error distinct from inferred causes.',
          },
          {
            id: 'request_response',
            number: '02',
            label: 'TRACE',
            title:
              'How is network evidence interpreted?',
            description:
              'See how request and response behaviour becomes assessable technical evidence.',
          },
          {
            id: 'configuration_clue',
            number: '03',
            label: 'CONFIG',
            title:
              'How is configuration evidence validated?',
            description:
              'Inspect how expected settings are compared with actual runtime behaviour.',
          },
          {
            id: 'evidence_comparison',
            number: '04',
            label: 'SYNTHESIZE',
            title:
              'How is evidence combined without answer leakage?',
            description:
              'See how the analyst supports interpretation while leaving the judgement to the learner.',
          },
        ];

      case 'guest':
        return [
          {
            id: 'error_signal',
            number: '01',
            label: 'ERROR',
            title:
              'What can an error message prove?',
            description:
              'See why an error is evidence, but not automatically the root cause.',
          },
          {
            id: 'request_response',
            number: '02',
            label: 'NETWORK',
            title:
              'What can a failed request reveal?',
            description:
              'See how engineers use request and response behaviour to locate a problem.',
          },
          {
            id: 'configuration_clue',
            number: '03',
            label: 'CONFIG',
            title:
              'Why compare configuration with runtime behaviour?',
            description:
              'See how a mismatch can become a useful technical clue.',
          },
          {
            id: 'evidence_comparison',
            number: '04',
            label: 'COMPARE',
            title:
              'Why should clues be read together?',
            description:
              'See how several observations become stronger when they support the same technical story.',
          },
        ];
    }
  }

  getGuidance(
    role: VisitorRole,
    promptId: ErrorAnalystPromptId,
  ): ErrorAnalystGuidance {
    const sharedBoundary =
      'Error Analyst interprets only the evidence that is available. It does not invent logs, responses, configuration values, or a final root cause.';

    switch (promptId) {
      case 'error_signal':
        return this.errorSignal(
          role,
          sharedBoundary,
        );

      case 'request_response':
        return this.requestResponse(
          role,
          sharedBoundary,
        );

      case 'configuration_clue':
        return this.configurationClue(
          role,
          sharedBoundary,
        );

      case 'evidence_comparison':
        return this.evidenceComparison(
          role,
          sharedBoundary,
        );
    }
  }

  private errorSignal(
    role: VisitorRole,
    boundary: string,
  ): ErrorAnalystGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'Read the literal signal before diagnosing it.',
          message:
            'Start with what the error directly states: which operation failed, where it was observed, and whether the failure describes authentication, connectivity, configuration, validation, or another condition. Error messages are witnesses, not judges. Some of them are dramatic witnesses, but still.',
          checks: [
            'What operation was attempted when the error appeared?',
            'What does the error explicitly state, without interpretation?',
            'What possible causes are still not proven by this error alone?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'The analyst separates evidence from diagnosis.',
          message:
            'FirstCommit treats the error as an observed signal, not as an automatic answer. The learner still has to connect that signal to other evidence before deciding on a cause. The error may be loud; that does not make it the root cause. Software also enjoys pointing fingers.',
          checks: [
            'Is the observed error preserved as evidence?',
            'Does the guidance avoid turning one message into a diagnosis?',
            'Does the learner still need corroborating evidence?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Observation remains distinct from inference.',
          message:
            'The analyst encourages the learner to record the literal technical signal first, then explain what it may support. This makes the reasoning process easier to assess. Read the sentence before writing the diagnosis. Punctuation has saved more investigations than it gets credit for.',
          checks: [
            'What is directly observable in the error?',
            'What interpretation is the learner adding?',
            'What additional evidence would validate that interpretation?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'An error message is a clue, not the whole answer.',
          message:
            'An error can tell you what failed or where a problem became visible, but engineers usually need more evidence before deciding why it happened. Loud does not necessarily mean guilty. Ask any stack trace.',
          checks: [
            'What failed?',
            'Where was the error observed?',
            'What would you need to inspect next?',
          ],
          boundary,
        };
    }
  }

  private requestResponse(
    role: VisitorRole,
    boundary: string,
  ): ErrorAnalystGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'Trace the request from origin to outcome.',
          message:
            'Inspect the request URL, method, destination, status or network failure, and whether a response was received. Those facts can help distinguish a frontend configuration problem from an API or database problem. A request sent to the wrong address can have excellent manners and still never arrive. Very polite. Very useless.',
          checks: [
            'Where is the request actually being sent?',
            'Did the server return an HTTP response, or did the request fail before that?',
            'Does another known-good endpoint behave differently?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'Network evidence helps isolate the failing boundary.',
          message:
            'The analyst encourages inspection of request destination and response behaviour so the learner can narrow the problem without receiving a preselected diagnosis. Network traces are much less impressed by assumptions than people are. They prefer timestamps.',
          checks: [
            'Is the request destination visible to the learner?',
            'Can the learner distinguish no response from an application error response?',
            'Does the evidence support narrowing the failing system boundary?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Request and response behaviour becomes traceable evidence.',
          message:
            'The learner can use network observations to justify why a failure appears before, at, or after the API boundary rather than making an unsupported statement. The packet trail gets a vote. It is usually annoyingly specific.',
          checks: [
            'What request details are directly observable?',
            'Was a response produced?',
            'How does that observation change the competing hypotheses?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'A request can show where the system is trying to communicate.',
          message:
            'If the browser sends a request to the wrong place, or never receives a response, that can narrow the investigation even before anyone changes code. Sometimes the bug is simply very committed to the wrong destination. Loyalty is admirable; routing is less forgiving.',
          checks: [
            'Where is the request going?',
            'Did anything answer it?',
            'What part of the system should be checked next?',
          ],
          boundary,
        };
    }
  }

  private configurationClue(
    role: VisitorRole,
    boundary: string,
  ): ErrorAnalystGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'Compare intended configuration with observed runtime behaviour.',
          message:
            'A configuration value matters when it explains what the running application actually does. Compare the expected production setting with the request, endpoint, or behaviour you observe at runtime. Configuration has a talent for being “correct” in the file nobody is actually running. A timeless classic.',
          checks: [
            'What value is configured for this environment?',
            'What value or destination is the running application actually using?',
            'Does the mismatch explain the observed behaviour, or is more evidence needed?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'Configuration is treated as evidence only when tied to runtime behaviour.',
          message:
            'The analyst does not flag a setting simply because it looks suspicious. The learner is encouraged to connect configuration to what the deployed application actually does. Suspicious-looking settings still need evidence, not side-eye. The side-eye may continue privately.',
          checks: [
            'Is there a clear expected configuration?',
            'Is the runtime behaviour observable?',
            'Can the learner connect the two without guessing?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Configuration evidence is validated through behaviour.',
          message:
            'The learner is prompted to compare expected environment-specific settings with the behaviour of the running application, strengthening the evidence chain. Expected and actual should eventually meet in the same sentence. Preferably before deployment Friday.',
          checks: [
            'What setting is expected in this environment?',
            'What runtime evidence confirms or contradicts it?',
            'Is the conclusion traceable to both sources?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'A setting matters when it changes what the application does.',
          message:
            'Engineers compare the configuration that should be active with the behaviour they can observe. A mismatch can become a strong clue. “It should be using that value” is an excellent invitation to verify it. “Should” has a long criminal record in debugging.',
          checks: [
            'What setting should be active?',
            'What is the application actually doing?',
            'Do those two things match?',
          ],
          boundary,
        };
    }
  }

  private evidenceComparison(
    role: VisitorRole,
    boundary: string,
  ): ErrorAnalystGuidance {
    switch (role) {
      case 'learner':
        return {
          title:
            'Look for a technical story supported by multiple clues.',
          message:
            'Strong evidence often comes from agreement between different sources: for example a health check, a failed browser request, and a configuration value. Compare what each clue proves and where they overlap. One clue can be moody; several independent clues agreeing is harder to ignore. Even logs form committees sometimes.',
          checks: [
            'Which findings agree with one another?',
            'Which cause is weakened by the evidence?',
            'What uncertainty still remains after combining the clues?',
          ],
          boundary,
        };

      case 'recruiter':
        return {
          title:
            'The analyst supports synthesis without making the final judgement.',
          message:
            'FirstCommit can help surface relationships between technical clues, but the learner remains responsible for deciding what those relationships mean for the final cause assessment. The analyst can arrange the puzzle pieces; the learner still names the picture. No peeking at the box lid.',
          checks: [
            'Are multiple evidence sources considered?',
            'Does the guidance identify relationships rather than invent facts?',
            'Is the final judgement still left to the learner?',
          ],
          boundary,
        };

      case 'educator_assessor':
        return {
          title:
            'Evidence synthesis remains visible and assessable.',
          message:
            'The analyst prompts the learner to explain how different evidence sources reinforce or contradict one another instead of presenting an opaque answer. Evidence should be able to introduce its friends. Anonymous rumours belong in a different department.',
          checks: [
            'Can the learner explain how the evidence sources relate?',
            'Are contradictions or unresolved gaps acknowledged?',
            'Does the final judgement remain independently authored?',
          ],
          boundary,
        };

      case 'guest':
        return {
          title:
            'Several clues can form a stronger technical picture.',
          message:
            'One clue can be ambiguous. When different observations point in the same direction, the investigation becomes more convincing. Clues travel better in company. One lonely log line should not be asked to carry the whole case.',
          checks: [
            'Which clues point in the same direction?',
            'Which explanation becomes less likely?',
            'What would you still want to verify?',
          ],
          boundary,
        };
    }
  }
}