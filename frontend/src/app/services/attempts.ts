import { API_BASE_URL } from '../config/api.config';
import {
  inject,
  Service,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

export type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'reviewed';

export type CauseAssessmentStatus =
  | 'supported'
  | 'eliminated'
  | 'unresolved';

export type ReviewerRating =
  | 'strong'
  | 'developing'
  | 'needs_revision';

export interface Attempt {
  attemptId: number;
  learnerId: number;
  scenarioId: number;
  status: AttemptStatus;
  startedAt: string;
}

export interface PersistedAttempt
  extends Attempt {
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface StartAttemptRequest {
  scenarioId: number;
}

export interface StartAttemptResponse {
  created: boolean;
  attempt: PersistedAttempt;
}

export interface InvestigationStep {
  stepId: number;
  attemptId: number;
  evidenceId: number | null;
  stepNo: number;
  observation: string;
  nextAction: string;
  reasoning: string;
  createdAt: string;
}

export interface InvestigationEvidence {
  evidenceId: number;
  evidenceCode: string;
  title: string;
  evidenceType: string;
  content: string;
  sequenceNo: number;
  unlockAfterStep: number;
}

export interface AttemptProgress {
  completedSteps: number;
}

export interface EvidenceProgress {
  availableEvidenceCount: number;
  totalEvidenceCount: number;
  allEvidenceUnlocked: boolean;
}

export interface CauseProgress {
  assessedCauseCount: number;
  totalCauseCount: number;
  allCausesAssessed: boolean;
}

export interface CauseAssessment {
  causeAssessmentId: number;
  attemptId: number;
  causeOptionId: number;
  causeCode: string;
  label: string;
  assessment: CauseAssessmentStatus;
  reasoning: string;
  assessedAt: string;
  updatedAt: string;
}

export interface FinalConclusion {
  probableRootCause: string | null;
  finalReasoning: string | null;
  recommendedAction: string | null;
}

export interface ConclusionProgress {
  isConclusionComplete: boolean;
}

export interface LearnerReviewerFeedback {
  feedbackId: number;
  reviewerId: number;
  reasoningQuality: ReviewerRating;
  evidenceUsage: ReviewerRating;
  technicalCommunication: ReviewerRating;
  feedbackText: string;
  createdAt: string;
}

export interface AttemptStateResponse {
  attempt: PersistedAttempt;
  progress: AttemptProgress;
  evidenceProgress: EvidenceProgress;
  causeProgress: CauseProgress;
  conclusion: FinalConclusion;
  conclusionProgress: ConclusionProgress;
  steps: InvestigationStep[];
  availableEvidence: InvestigationEvidence[];
  causeAssessments: CauseAssessment[];
  reviewerFeedback:
    LearnerReviewerFeedback | null;
}

export interface RecordStepRequest {
  evidenceId: number | null;
  observation: string;
  nextAction: string;
  reasoning: string;
}

export interface RecordStepResponse {
  step: InvestigationStep;
  progress: AttemptProgress;
  evidenceProgress: EvidenceProgress;
  availableEvidence: InvestigationEvidence[];
  newlyUnlockedEvidence: InvestigationEvidence[];
}

export interface AssessCauseRequest {
  assessment: CauseAssessmentStatus;
  reasoning: string;
}

export interface AssessedCause {
  causeOptionId: number;
  causeCode: string;
  label: string;
  description: string;
  sequenceNo: number;
}

export interface SavedCauseAssessment {
  causeAssessmentId: number;
  attemptId: number;
  causeOptionId: number;
  assessment: CauseAssessmentStatus;
  reasoning: string;
  assessedAt: string;
  updatedAt: string;
}

export interface AssessCauseResponse {
  cause: AssessedCause;
  assessment: SavedCauseAssessment;
  causeProgress: CauseProgress;
}

export interface SaveConclusionRequest {
  probableRootCause: string;
  finalReasoning: string;
  recommendedAction: string;
}

export interface SaveConclusionResponse {
  conclusion: FinalConclusion;
  conclusionProgress: ConclusionProgress;
  evidenceProgress: EvidenceProgress;
  causeProgress: CauseProgress;
}

export interface SubmitAttemptResponse {
  attempt: PersistedAttempt;
  evidenceProgress: EvidenceProgress;
  causeProgress: CauseProgress;
  conclusionProgress: ConclusionProgress;
}

@Service()
export class Attempts {
  private readonly http =
    inject(HttpClient);

  private readonly attemptsUrl =
    API_BASE_URL + '/attempts';

  startAttempt(
    scenarioId: number,
  ): Observable<StartAttemptResponse> {
    const body: StartAttemptRequest = {
      scenarioId,
    };

    return this.http.post<StartAttemptResponse>(
      this.attemptsUrl,
      body,
    );
  }

  getAttempt(
    attemptId: number,
  ): Observable<AttemptStateResponse> {
    return this.http.get<AttemptStateResponse>(
      `${this.attemptsUrl}/${attemptId}`,
    );
  }

  recordStep(
    attemptId: number,
    request: RecordStepRequest,
  ): Observable<RecordStepResponse> {
    return this.http.post<RecordStepResponse>(
      `${this.attemptsUrl}/${attemptId}/steps`,
      request,
    );
  }

  assessCause(
    attemptId: number,
    causeOptionId: number,
    request: AssessCauseRequest,
  ): Observable<AssessCauseResponse> {
    return this.http.put<AssessCauseResponse>(
      `${this.attemptsUrl}/${attemptId}/causes/${causeOptionId}`,
      request,
    );
  }

  saveConclusion(
    attemptId: number,
    request: SaveConclusionRequest,
  ): Observable<SaveConclusionResponse> {
    return this.http.put<SaveConclusionResponse>(
      `${this.attemptsUrl}/${attemptId}/conclusion`,
      request,
    );
  }

  submitAttempt(
    attemptId: number,
  ): Observable<SubmitAttemptResponse> {
    return this.http.post<SubmitAttemptResponse>(
      `${this.attemptsUrl}/${attemptId}/submit`,
      {},
    );
  }
}