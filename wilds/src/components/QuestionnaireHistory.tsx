import { useState, useMemo } from 'react';
import type { AppState, FilledQuestionnaire, QuestionScaleType } from '../types';
import { getResponseLabel, wasQuestionAvailableAtTime } from '../utils/questionnaireUtils';
import '../styles/QuestionnaireHistory.css';

interface QuestionnaireHistoryProps {
  appState: AppState;
  questionnaireId?: string; // If provided, only show history for this questionnaire
  onClose: () => void;
}

export default function QuestionnaireHistory({
  appState,
  questionnaireId,
  onClose
}: QuestionnaireHistoryProps) {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month' | 'quarter'>('month');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const questionnaire = questionnaireId
    ? appState.questionnaires?.find(q => q.id === questionnaireId)
    : null;

  const filteredEntries = useMemo(() => {
    let entries = appState.filledQuestionnaires || [];

    // Filter by questionnaire if specified
    if (questionnaireId) {
      entries = entries.filter(entry => entry.questionnaireId === questionnaireId);
    }

    // Filter by time range
    if (timeFilter !== 'all') {
      const now = Date.now();
      let cutoffTime: number;

      switch (timeFilter) {
        case 'week':
          cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarter':
          cutoffTime = now - (90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffTime = 0;
      }

      entries = entries.filter(entry => entry.filledAt >= cutoffTime);
    }

    // Sort entries
    entries.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.filledAt - a.filledAt;
      } else {
        return a.filledAt - b.filledAt;
      }
    });

    return entries;
  }, [appState.filledQuestionnaires, questionnaireId, timeFilter, sortOrder]);





  const getResponseColor = (value: number, scaleType: QuestionScaleType): string => {
    if (scaleType === 'binary') {
      return value === 1 ? '#22c55e' : '#ef4444';
    }

    // For scale types, use a gradient from red (negative) to green (positive)
    const maxVal = scaleType === 'five-point' ? 2 : 3;
    const normalized = value / maxVal; // -1 to 1

    if (normalized < -0.5) return '#dc2626';
    if (normalized < -0.2) return '#ef4444';
    if (normalized < 0.2) return '#6b7280';
    if (normalized < 0.5) return '#22c55e';
    return '#16a34a';
  };

  const groupEntriesByDate = (entries: FilledQuestionnaire[]) => {
    const groups: { [date: string]: FilledQuestionnaire[] } = {};

    entries.forEach(entry => {
      const date = new Date(entry.filledAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });

    return groups;
  };

  const groupedEntries = groupEntriesByDate(filteredEntries);
  const selectedEntryData = selectedEntry
    ? filteredEntries.find(e => e.id === selectedEntry)
    : null;

  const selectedQuestionnaireConfig = selectedEntryData
    ? appState.questionnaires?.find(q => q.id === selectedEntryData.questionnaireId)
    : null;

  return (
    <>
      <div className="questionnaire-overlay" onClick={onClose}></div>
      <div className="questionnaire-history">
        <div className="questionnaire-history-header">
          <h2>
            {questionnaire ? `${questionnaire.name} History` : 'Questionnaire History'}
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="history-filters">
          <div className="filter-group">
            <label htmlFor="time-filter">Time Range:</label>
            <select
              id="time-filter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as typeof timeFilter)}
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="sort-order">Sort:</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="history-content">
          {filteredEntries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <h3>No Questionnaire History</h3>
              <p>No completed questionnaires found for the selected time range.</p>
            </div>
          ) : (
            <div className="history-list">
              {Object.entries(groupedEntries).map(([date, entries]) => (
                <div key={date} className="history-date-group">
                  <h3 className="history-date-header">
                    {new Date(date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  {entries.map(entry => (
                    <div
                      key={entry.id}
                      className={`history-entry ${selectedEntry === entry.id ? 'selected' : ''}`}
                      onClick={() => setSelectedEntry(selectedEntry === entry.id ? null : entry.id)}
                    >
                      <div className="history-entry-header">
                        <div className="history-entry-info">
                          <h4 className="history-entry-title">{entry.questionnaireName}</h4>
                          <span className="history-entry-time">
                            {new Date(entry.filledAt).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </span>
                        </div>
                        <div className="history-entry-summary">
                          <span className="response-count">
                            {entry.responses.length} response{entry.responses.length !== 1 ? 's' : ''}
                          </span>
                          {entry.notes && (
                            <span className="has-notes-indicator" title="Has notes">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedEntry === entry.id && selectedQuestionnaireConfig && (
                        <div className="history-entry-details">
                          <div className="responses-list">
                            {selectedQuestionnaireConfig.questions
                              .filter(q => !q.archived)
                              .map(question => {
                                const response = entry.responses.find(r => r.questionId === question.id);
                                const wasAvailable = wasQuestionAvailableAtTime(question, entry.filledAt);

                                return (
                                  <div key={question.id} className="response-item">
                                    <div className="response-question">
                                      {question.text}
                                    </div>
                                    <div className="response-value">
                                      {response && wasAvailable ? (
                                        <>
                                          <span
                                            style={{ color: getResponseColor(response.value, question.scaleType) }}
                                          >
                                            {getResponseLabel(response.value, question.scaleType, question.scaleLabels)}
                                            {question.scaleType !== 'binary' && (
                                              <span className="response-numeric">
                                                ({response.value > 0 ? '+' : ''}{response.value})
                                              </span>
                                            )}
                                          </span>
                                        </>
                                      ) : !wasAvailable ? (
                                        <span className="response-absent">
                                          Absent in that day's questionnaire version
                                        </span>
                                      ) : (
                                        <span className="response-missing">
                                          No response
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          {entry.notes && (
                            <div className="entry-notes">
                              <h5>Notes:</h5>
                              <p>{entry.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredEntries.length > 0 && (
          <div className="history-footer">
            <div className="history-stats">
              <span className="stat-item">
                Total entries: {filteredEntries.length}
              </span>
              {timeFilter !== 'all' && (
                <span className="stat-item">
                  Time range: {timeFilter}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}