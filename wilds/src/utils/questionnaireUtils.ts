import type { QuestionScaleType, ScaleLabels, FilledQuestionnaire } from '../types';

export const getDefaultScaleLabels = (scaleType: QuestionScaleType): ScaleLabels => {
  switch (scaleType) {
    case 'binary':
      return {
        binary: {
          positive: 'Yes',
          negative: 'No'
        }
      };
    case 'five-point':
      return {
        fivePoint: {
          veryNegative: 'Strongly Disagree',
          negative: 'Disagree',
          neutral: 'Neutral',
          positive: 'Agree',
          veryPositive: 'Strongly Agree'
        }
      };
    case 'seven-point':
      return {
        sevenPoint: {
          veryNegative: 'Strongly Disagree',
          negative: 'Disagree',
          somewhatNegative: 'Somewhat Disagree',
          neutral: 'Neutral',
          somewhatPositive: 'Somewhat Agree',
          positive: 'Agree',
          veryPositive: 'Strongly Agree'
        }
      };
    default:
      return {};
  }
};

export const getScaleLabelsForType = (scaleLabels: ScaleLabels | undefined, scaleType: QuestionScaleType) => {
  const defaultLabels = getDefaultScaleLabels(scaleType);

  if (!scaleLabels) {
    return defaultLabels;
  }

  switch (scaleType) {
    case 'binary':
      return {
        binary: {
          positive: scaleLabels.binary?.positive || defaultLabels.binary!.positive,
          negative: scaleLabels.binary?.negative || defaultLabels.binary!.negative
        }
      };
    case 'five-point':
      return {
        fivePoint: {
          veryNegative: scaleLabels.fivePoint?.veryNegative || defaultLabels.fivePoint!.veryNegative,
          negative: scaleLabels.fivePoint?.negative || defaultLabels.fivePoint!.negative,
          neutral: scaleLabels.fivePoint?.neutral || defaultLabels.fivePoint!.neutral,
          positive: scaleLabels.fivePoint?.positive || defaultLabels.fivePoint!.positive,
          veryPositive: scaleLabels.fivePoint?.veryPositive || defaultLabels.fivePoint!.veryPositive
        }
      };
    case 'seven-point':
      return {
        sevenPoint: {
          veryNegative: scaleLabels.sevenPoint?.veryNegative || defaultLabels.sevenPoint!.veryNegative,
          negative: scaleLabels.sevenPoint?.negative || defaultLabels.sevenPoint!.negative,
          somewhatNegative: scaleLabels.sevenPoint?.somewhatNegative || defaultLabels.sevenPoint!.somewhatNegative,
          neutral: scaleLabels.sevenPoint?.neutral || defaultLabels.sevenPoint!.neutral,
          somewhatPositive: scaleLabels.sevenPoint?.somewhatPositive || defaultLabels.sevenPoint!.somewhatPositive,
          positive: scaleLabels.sevenPoint?.positive || defaultLabels.sevenPoint!.positive,
          veryPositive: scaleLabels.sevenPoint?.veryPositive || defaultLabels.sevenPoint!.veryPositive
        }
      };
    default:
      return {};
  }
};

export const getResponseLabel = (value: number, scaleType: QuestionScaleType, scaleLabels?: ScaleLabels): string => {
  const labels = getScaleLabelsForType(scaleLabels, scaleType);

  switch (scaleType) {
    case 'binary':
      return value === 1 ? labels.binary!.positive : labels.binary!.negative;
    case 'five-point':
      const fivePointValues = [
        labels.fivePoint!.veryNegative,
        labels.fivePoint!.negative,
        labels.fivePoint!.neutral,
        labels.fivePoint!.positive,
        labels.fivePoint!.veryPositive
      ];
      return fivePointValues[value + 2] || `${value > 0 ? '+' : ''}${value}`;
    case 'seven-point':
      const sevenPointValues = [
        labels.sevenPoint!.veryNegative,
        labels.sevenPoint!.negative,
        labels.sevenPoint!.somewhatNegative,
        labels.sevenPoint!.neutral,
        labels.sevenPoint!.somewhatPositive,
        labels.sevenPoint!.positive,
        labels.sevenPoint!.veryPositive
      ];
      return sevenPointValues[value + 3] || `${value > 0 ? '+' : ''}${value}`;
    default:
      return value.toString();
  }
};

/**
 * Determines if a question existed in a questionnaire at a specific time
 * by checking if the question was created before the filled time
 */
export const wasQuestionAvailableAtTime = (question: any, filledAt: number): boolean => {
  // If no creation time is available, assume it existed (backwards compatibility)
  if (!question.createdAt) {
    return true;
  }

  // Question existed if it was created before the questionnaire was filled
  return question.createdAt <= filledAt;
};

/**
 * Calculates the optimal time window for showing tracker data around a questionnaire filling
 * Uses the smaller of:
 * A. Time till the previous filling of the questionnaire
 * B. Time till the next filling of the questionnaire
 * Falls back to 4 hours if no other fillings exist
 */
export function calculateTrackerTimeWindow(
  currentFilling: FilledQuestionnaire,
  allFillings: FilledQuestionnaire[]
): { startTime: number; endTime: number } {
  const currentTime = currentFilling.filledAt;
  const defaultWindow = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  // Find all other fillings of the same questionnaire, sorted by time
  const sameQuestionnaire = allFillings
    .filter(f => f.questionnaireId === currentFilling.questionnaireId && f.id !== currentFilling.id)
    .sort((a, b) => a.filledAt - b.filledAt);

  // Find the previous and next fillings
  const previousFilling = sameQuestionnaire
    .filter(f => f.filledAt < currentTime)
    .pop(); // Last one before current

  const nextFilling = sameQuestionnaire
    .find(f => f.filledAt > currentTime); // First one after current

  // Calculate time gaps
  let beforeWindow = defaultWindow;
  let afterWindow = defaultWindow;

  if (previousFilling) {
    const gapToPrevious = currentTime - previousFilling.filledAt;
    beforeWindow = Math.min(beforeWindow, Math.floor(gapToPrevious / 2));
  }

  if (nextFilling) {
    const gapToNext = nextFilling.filledAt - currentTime;
    afterWindow = Math.min(afterWindow, Math.floor(gapToNext / 2));
  }

  // Ensure minimum window of 30 minutes on each side
  const minimumWindow = 30 * 60 * 1000; // 30 minutes
  beforeWindow = Math.max(beforeWindow, minimumWindow);
  afterWindow = Math.max(afterWindow, minimumWindow);

  return {
    startTime: currentTime - beforeWindow,
    endTime: currentTime + afterWindow
  };
}