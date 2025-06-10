import { useState } from 'react';
import type { AppState, QuestionnaireConfig } from '../types';
import '../styles/QuestionnaireManager.css';

interface QuestionnaireManagerProps {
  appState: AppState;
  onCreateQuestionnaire: (name: string, description?: string) => void;
  onEditQuestionnaire: (questionnaireId: string) => void;
  onFillQuestionnaire: (questionnaireId: string) => void;
  onViewHistory: (questionnaireId: string) => void;
  onToggleActive: (questionnaireId: string, isActive: boolean) => void;
  onArchiveQuestionnaire: (questionnaireId: string) => void;
  onClose: () => void;
}

export default function QuestionnaireManager({
  appState,
  onCreateQuestionnaire,
  onEditQuestionnaire,
  onFillQuestionnaire,
  onViewHistory,
  onToggleActive,
  onArchiveQuestionnaire,
  onClose
}: QuestionnaireManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestionnaireName, setNewQuestionnaireName] = useState('');
  const [newQuestionnaireDescription, setNewQuestionnaireDescription] = useState('');

  const activeQuestionnaires = (appState.questionnaires || []).filter(q => !q.archived);
  const hasQuestionnaires = activeQuestionnaires.length > 0;

  const handleCreateSubmit = () => {
    if (newQuestionnaireName.trim()) {
      onCreateQuestionnaire(
        newQuestionnaireName.trim(),
        newQuestionnaireDescription.trim() || undefined
      );
      setNewQuestionnaireName('');
      setNewQuestionnaireDescription('');
      setShowCreateForm(false);
    }
  };

  const handleCreateCancel = () => {
    setNewQuestionnaireName('');
    setNewQuestionnaireDescription('');
    setShowCreateForm(false);
  };

  const getFrequencyText = (questionnaire: QuestionnaireConfig): string => {
    const { frequency } = questionnaire;
    switch (frequency.type) {
      case 'daily':
        return `Daily${frequency.time ? ` at ${frequency.time}` : ''}`;
      case 'weekly':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNames = frequency.weekdays?.map(d => days[d]).join(', ') || 'Sunday';
        return `Weekly on ${dayNames}${frequency.time ? ` at ${frequency.time}` : ''}`;
      case 'custom':
        return `Every ${frequency.interval || 24} hours`;
      default:
        return 'Not scheduled';
    }
  };

  const getFilledCount = (questionnaireId: string): number => {
    return (appState.filledQuestionnaires || []).filter(
      f => f.questionnaireId === questionnaireId
    ).length;
  };

  return (
    <>
      <div className="questionnaire-overlay" onClick={onClose}></div>
      <div className="questionnaire-manager">
        <div className="questionnaire-manager-header">
          <h2>Questionnaires</h2>
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="questionnaire-manager-content">
          {!hasQuestionnaires && !showCreateForm && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>No Questionnaires Yet</h3>
              <p>Create your first questionnaire to start tracking your wellness with structured questions.</p>
            </div>
          )}

          {hasQuestionnaires && (
            <div className="questionnaire-list">
              {activeQuestionnaires.map(questionnaire => (
                <div key={questionnaire.id} className="questionnaire-card">
                  <div className="questionnaire-card-header">
                    <div className="questionnaire-info">
                      <h3 className="questionnaire-name">{questionnaire.name}</h3>
                      {questionnaire.description && (
                        <p className="questionnaire-description">{questionnaire.description}</p>
                      )}
                    </div>
                    <div className="questionnaire-status">
                      <button
                        className={`status-toggle ${questionnaire.isActive ? 'active' : 'inactive'}`}
                        onClick={() => onToggleActive(questionnaire.id, !questionnaire.isActive)}
                        title={questionnaire.isActive ? 'Deactivate questionnaire' : 'Activate questionnaire'}
                      >
                        {questionnaire.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>

                  <div className="questionnaire-details">
                    <div className="detail-item">
                      <span className="detail-label">Questions:</span>
                      <span className="detail-value">{questionnaire.questions.filter(q => !q.archived).length}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Frequency:</span>
                      <span className="detail-value">{getFrequencyText(questionnaire)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Completed:</span>
                      <span className="detail-value">{getFilledCount(questionnaire.id)} times</span>
                    </div>
                  </div>

                  <div className="questionnaire-actions">
                    <button
                      className="action-button fill-button"
                      onClick={() => onFillQuestionnaire(questionnaire.id)}
                      disabled={questionnaire.questions.filter(q => !q.archived).length === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                      Fill
                    </button>
                    <button
                      className="action-button edit-button"
                      onClick={() => onEditQuestionnaire(questionnaire.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                    <button
                      className="action-button history-button"
                      onClick={() => onViewHistory(questionnaire.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v5h5"></path>
                        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
                      </svg>
                      History
                    </button>
                    <button
                      className="action-button archive-button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to archive "${questionnaire.name}"?`)) {
                          onArchiveQuestionnaire(questionnaire.id);
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="21 8 21 21 3 21 3 8"></polyline>
                        <rect x="1" y="3" width="22" height="5"></rect>
                        <line x1="10" y1="12" x2="14" y2="12"></line>
                      </svg>
                      Archive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showCreateForm && (
            <div className="create-questionnaire-form">
              <h3>Create New Questionnaire</h3>
              <div className="form-group">
                <label htmlFor="questionnaire-name">Name *</label>
                <input
                  id="questionnaire-name"
                  type="text"
                  value={newQuestionnaireName}
                  onChange={(e) => setNewQuestionnaireName(e.target.value)}
                  placeholder="e.g., Daily Mood Check-in"
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="questionnaire-description">Description</label>
                <textarea
                  id="questionnaire-description"
                  value={newQuestionnaireDescription}
                  onChange={(e) => setNewQuestionnaireDescription(e.target.value)}
                  placeholder="Optional description of what this questionnaire tracks..."
                  maxLength={500}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button className="cancel-button" onClick={handleCreateCancel}>
                  Cancel
                </button>
                <button
                  className="create-button"
                  onClick={handleCreateSubmit}
                  disabled={!newQuestionnaireName.trim()}
                >
                  Create Questionnaire
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="questionnaire-manager-footer">
          {!showCreateForm && (
            <button
              className="add-questionnaire-button"
              onClick={() => setShowCreateForm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              New Questionnaire
            </button>
          )}
        </div>
      </div>
    </>
  );
}