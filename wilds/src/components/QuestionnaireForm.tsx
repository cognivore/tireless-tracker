import { useState, useEffect } from 'react';
import type { AppState, QuestionResponse, QuestionData } from '../types';
import * as storageService from '../services/storageService';
import { getScaleLabelsForType } from '../utils/questionnaireUtils';
import '../styles/QuestionnaireForm.css';

interface QuestionnaireFormProps {
  appState: AppState;
  questionnaireId: string;
  onSubmitQuestionnaire: (questionnaireId: string, responses: QuestionResponse[], notes?: string) => void;
  onClose: () => void;
}

export default function QuestionnaireForm({
  appState,
  questionnaireId,
  onSubmitQuestionnaire,
  onClose
}: QuestionnaireFormProps) {
  const questionnaire = appState.questionnaires?.find(q => q.id === questionnaireId);
  const [responses, setResponses] = useState<Map<string, number>>(new Map());
  const [notes, setNotes] = useState('');
  const [showTrackerData, setShowTrackerData] = useState<string | null>(null);
  const [trackerTimeRange, setTrackerTimeRange] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    // Initialize responses with neutral values
    if (questionnaire) {
      const initialResponses = new Map<string, number>();
      questionnaire.questions
        .filter(q => !q.archived)
        .forEach(question => {
          // Set default neutral value based on scale type
          const neutralValue = question.scaleType === 'binary' ? 0 : 0;
          initialResponses.set(question.id, neutralValue);
        });
      setResponses(initialResponses);
    }
  }, [questionnaire]);

  if (!questionnaire) {
    return (
      <div className="questionnaire-form-error">
        <h2>Questionnaire Not Found</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  const activeQuestions = questionnaire.questions.filter(q => !q.archived);

  if (activeQuestions.length === 0) {
    return (
      <div className="questionnaire-form-error">
        <h2>No Questions Available</h2>
        <p>This questionnaire doesn't have any active questions yet.</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  const handleResponseChange = (questionId: string, value: number) => {
    setResponses(new Map(responses.set(questionId, value)));
  };

  const handleSubmit = () => {
    const questionResponses: QuestionResponse[] = Array.from(responses.entries()).map(
      ([questionId, value]) => ({
        questionId,
        value
      })
    );

    onSubmitQuestionnaire(questionnaireId, questionResponses, notes.trim() || undefined);
    onClose();
  };

  const getScaleOptions = (question: QuestionData) => {
    const labels = getScaleLabelsForType(question.scaleLabels, question.scaleType);

    switch (question.scaleType) {
      case 'binary':
        return [
          { value: 0, label: labels.binary!.negative, color: '#ef4444' },
          { value: 1, label: labels.binary!.positive, color: '#22c55e' }
        ];
      case 'five-point':
        return [
          { value: -2, label: labels.fivePoint!.veryNegative, color: '#ef4444' },
          { value: -1, label: labels.fivePoint!.negative, color: '#f97316' },
          { value: 0, label: labels.fivePoint!.neutral, color: '#6b7280' },
          { value: 1, label: labels.fivePoint!.positive, color: '#22c55e' },
          { value: 2, label: labels.fivePoint!.veryPositive, color: '#16a34a' }
        ];
      case 'seven-point':
        return [
          { value: -3, label: labels.sevenPoint!.veryNegative, color: '#dc2626' },
          { value: -2, label: labels.sevenPoint!.negative, color: '#ef4444' },
          { value: -1, label: labels.sevenPoint!.somewhatNegative, color: '#f97316' },
          { value: 0, label: labels.sevenPoint!.neutral, color: '#6b7280' },
          { value: 1, label: labels.sevenPoint!.somewhatPositive, color: '#65a30d' },
          { value: 2, label: labels.sevenPoint!.positive, color: '#22c55e' },
          { value: 3, label: labels.sevenPoint!.veryPositive, color: '#16a34a' }
        ];
    }
  };

  const getTrackerDataForQuestion = (questionId: string) => {
    const question = activeQuestions.find(q => q.id === questionId);
    if (!question || question.subscribedButtonIds.length === 0) {
      return null;
    }

    const now = Date.now();
    let startTime: number;

    switch (trackerTimeRange) {
      case 'day':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now - (24 * 60 * 60 * 1000);
    }

    return storageService.getTrackerDataForTimeRange(
      appState,
      question.subscribedButtonIds,
      startTime,
      now
    );
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const allResponsesProvided = activeQuestions.every(question =>
    responses.has(question.id) && responses.get(question.id) !== undefined
  );

  return (
    <>
      <div className="questionnaire-overlay" onClick={onClose}></div>
      <div className="questionnaire-form">
        <div className="questionnaire-form-header">
          <h2>{questionnaire.name}</h2>
          {questionnaire.description && (
            <p className="questionnaire-description">{questionnaire.description}</p>
          )}
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="questionnaire-form-content">
          {activeQuestions.map(question => {
            const options = getScaleOptions(question);
            const currentValue = responses.get(question.id);
            const trackerData = getTrackerDataForQuestion(question.id);

            return (
              <div key={question.id} className="question-container">
                <div className="question-header">
                  <h3 className="question-text">{question.text}</h3>
                  {trackerData && trackerData.length > 0 && (
                    <button
                      className="show-tracker-button"
                      onClick={() => setShowTrackerData(
                        showTrackerData === question.id ? null : question.id
                      )}
                      title="Show related tracker data"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      Journal
                    </button>
                  )}
                </div>

                {showTrackerData === question.id && trackerData && (
                  <div className="tracker-data-container">
                    <div className="tracker-data-header">
                      <h4>Related Tracker Data</h4>
                      <div className="time-range-selector">
                        <button
                          className={`time-range-button ${trackerTimeRange === 'day' ? 'active' : ''}`}
                          onClick={() => setTrackerTimeRange('day')}
                        >
                          24h
                        </button>
                        <button
                          className={`time-range-button ${trackerTimeRange === 'week' ? 'active' : ''}`}
                          onClick={() => setTrackerTimeRange('week')}
                        >
                          7d
                        </button>
                        <button
                          className={`time-range-button ${trackerTimeRange === 'month' ? 'active' : ''}`}
                          onClick={() => setTrackerTimeRange('month')}
                        >
                          30d
                        </button>
                      </div>
                    </div>
                    <div className="tracker-data-list">
                      {trackerData.map(buttonData => (
                        <div key={buttonData.buttonId} className="tracker-button-data">
                          <div className="tracker-button-info">
                            <span className="tracker-button-name">{buttonData.buttonName}</span>
                            <span className="tracker-button-count">
                              {buttonData.clicks.filter(c => !c.isDecrement).length} clicks
                            </span>
                          </div>
                          {buttonData.clicks.length > 0 && (
                            <div className="tracker-recent-clicks">
                              <span className="recent-label">Recent:</span>
                              {buttonData.clicks
                                .filter(c => !c.isDecrement)
                                .slice(-3)
                                .map((click, index) => (
                                  <span key={index} className="recent-click">
                                    {formatDate(click.timestamp)}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="question-options">
                  {options.map(option => (
                    <label
                      key={option.value}
                      className={`option-label ${currentValue === option.value ? 'selected' : ''}`}
                      style={{
                        '--option-color': currentValue === option.value ? option.color : undefined
                      } as React.CSSProperties}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.value}
                        checked={currentValue === option.value}
                        onChange={() => handleResponseChange(question.id, option.value)}
                        className="option-input"
                      />
                      <span className="option-text">{option.label}</span>
                      {question.scaleType !== 'binary' && (
                        <span className="option-value">({option.value > 0 ? '+' : ''}{option.value})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="notes-container">
            <label htmlFor="questionnaire-notes" className="notes-label">
              Additional Notes (Optional)
            </label>
            <textarea
              id="questionnaire-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts or context..."
              maxLength={1000}
              rows={4}
              className="notes-textarea"
            />
          </div>
        </div>

        <div className="questionnaire-form-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={!allResponsesProvided}
          >
            Submit Questionnaire
          </button>
        </div>
      </div>
    </>
  );
}