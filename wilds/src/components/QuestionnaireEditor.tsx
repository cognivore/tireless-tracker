import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import type { AppState, QuestionnaireConfig, QuestionData, QuestionScaleType } from '../types';
import '../styles/QuestionnaireEditor.css';

interface QuestionnaireEditorProps {
  appState: AppState;
  questionnaireId: string;
  onUpdateQuestionnaire: (questionnaireId: string, updates: Partial<QuestionnaireConfig>) => void;
  onAddQuestion: (questionnaireId: string, text: string, scaleType: QuestionScaleType, subscribedButtonIds: string[]) => void;
  onUpdateQuestion: (questionnaireId: string, questionId: string, updates: Partial<QuestionData>) => void;
  onReorderQuestions: (questionnaireId: string, sourceIndex: number, destinationIndex: number) => void;
  onArchiveQuestion: (questionnaireId: string, questionId: string) => void;
  onScheduleNotifications: (questionnaireId: string) => void;
  onClose: () => void;
}

export default function QuestionnaireEditor({
  appState,
  questionnaireId,
  onUpdateQuestionnaire,
  onAddQuestion,
  onUpdateQuestion,
  onReorderQuestions,
  onArchiveQuestion,
  onScheduleNotifications,
  onClose
}: QuestionnaireEditorProps) {
  const questionnaire = appState.questionnaires?.find(q => q.id === questionnaireId);

  const [activeTab, setActiveTab] = useState<'settings' | 'questions'>('settings');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Settings form state
  const [name, setName] = useState(questionnaire?.name || '');
  const [description, setDescription] = useState(questionnaire?.description || '');
  const [frequencyType, setFrequencyType] = useState(questionnaire?.frequency.type || 'daily');
  const [frequencyTime, setFrequencyTime] = useState(questionnaire?.frequency.time || '20:00');
  const [frequencyInterval, setFrequencyInterval] = useState(questionnaire?.frequency.interval || 24);
  const [frequencyWeekdays, setFrequencyWeekdays] = useState(questionnaire?.frequency.weekdays || [0]);

  // Question form state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionScale, setNewQuestionScale] = useState<QuestionScaleType>('five-point');
  const [newQuestionButtonIds, setNewQuestionButtonIds] = useState<string[]>([]);

  useEffect(() => {
    if (questionnaire) {
      setName(questionnaire.name);
      setDescription(questionnaire.description || '');
      setFrequencyType(questionnaire.frequency.type);
      setFrequencyTime(questionnaire.frequency.time || '20:00');
      setFrequencyInterval(questionnaire.frequency.interval || 24);
      setFrequencyWeekdays(questionnaire.frequency.weekdays || [0]);
    }
  }, [questionnaire]);

  if (!questionnaire) {
    return (
      <div className="questionnaire-editor-error">
        <h2>Questionnaire Not Found</h2>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  const handleSaveSettings = () => {
    const updates: Partial<QuestionnaireConfig> = {
      name: name.trim(),
      description: description.trim() || undefined,
      frequency: {
        type: frequencyType,
        time: frequencyTime,
        interval: frequencyInterval,
        weekdays: frequencyWeekdays
      }
    };

    onUpdateQuestionnaire(questionnaireId, updates);

    // Schedule notifications if the questionnaire is active
    if (questionnaire.isActive) {
      onScheduleNotifications(questionnaireId);
    }
  };

  const handleAddQuestion = () => {
    if (newQuestionText.trim()) {
      onAddQuestion(
        questionnaireId,
        newQuestionText.trim(),
        newQuestionScale,
        newQuestionButtonIds
      );
      setNewQuestionText('');
      setNewQuestionScale('five-point');
      setNewQuestionButtonIds([]);
      setShowAddQuestion(false);
    }
  };

  const handleEditQuestion = (question: QuestionData) => {
    setEditingQuestionId(question.id);
    setNewQuestionText(question.text);
    setNewQuestionScale(question.scaleType);
    setNewQuestionButtonIds(question.subscribedButtonIds);
    setShowAddQuestion(true);
  };

  const handleUpdateQuestion = () => {
    if (editingQuestionId && newQuestionText.trim()) {
      onUpdateQuestion(questionnaireId, editingQuestionId, {
        text: newQuestionText.trim(),
        scaleType: newQuestionScale,
        subscribedButtonIds: newQuestionButtonIds
      });
      setEditingQuestionId(null);
      setNewQuestionText('');
      setNewQuestionScale('five-point');
      setNewQuestionButtonIds([]);
      setShowAddQuestion(false);
    }
  };

  const handleCancelQuestion = () => {
    setEditingQuestionId(null);
    setNewQuestionText('');
    setNewQuestionScale('five-point');
    setNewQuestionButtonIds([]);
    setShowAddQuestion(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    onReorderQuestions(
      questionnaireId,
      result.source.index,
      result.destination.index
    );
  };

  const getScaleLabel = (scaleType: QuestionScaleType): string => {
    switch (scaleType) {
      case 'binary': return 'Yes/No';
      case 'five-point': return '5-point (-2 to +2)';
      case 'seven-point': return '7-point (-3 to +3)';
    }
  };



  const availableButtons = appState.screens
    .filter(screen => !screen.archived)
    .flatMap(screen =>
      screen.buttons
        .filter(button => !button.archived)
        .map(button => ({
          id: button.id,
          text: button.text,
          screenName: screen.name
        }))
    );

  const activeQuestions = questionnaire.questions.filter(q => !q.archived);

  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <>
      <div className="questionnaire-overlay" onClick={onClose}></div>
      <div className="questionnaire-editor">
        <div className="questionnaire-editor-header">
          <h2>Edit Questionnaire</h2>
          <button className="close-button" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="questionnaire-editor-tabs">
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          <button
            className={`tab-button ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Questions ({activeQuestions.length})
          </button>
        </div>

        <div className="questionnaire-editor-content">
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="form-group">
                <label htmlFor="questionnaire-name">Name *</label>
                <input
                  id="questionnaire-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Questionnaire name"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="questionnaire-description">Description</label>
                <textarea
                  id="questionnaire-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  maxLength={500}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="frequency-type">Frequency *</label>
                <select
                  id="frequency-type"
                  value={frequencyType}
                  onChange={(e) => setFrequencyType(e.target.value as 'daily' | 'weekly' | 'custom')}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {(frequencyType === 'daily' || frequencyType === 'weekly') && (
                <div className="form-group">
                  <label htmlFor="frequency-time">Time</label>
                  <input
                    id="frequency-time"
                    type="time"
                    value={frequencyTime}
                    onChange={(e) => setFrequencyTime(e.target.value)}
                  />
                </div>
              )}

              {frequencyType === 'weekly' && (
                <div className="form-group">
                  <label>Days of the week</label>
                  <div className="weekday-selector">
                    {weekdayNames.map((day, index) => (
                      <label key={index} className="weekday-option">
                        <input
                          type="checkbox"
                          checked={frequencyWeekdays.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFrequencyWeekdays([...frequencyWeekdays, index]);
                            } else {
                              setFrequencyWeekdays(frequencyWeekdays.filter(d => d !== index));
                            }
                          }}
                        />
                        {day.slice(0, 3)}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {frequencyType === 'custom' && (
                <div className="form-group">
                  <label htmlFor="frequency-interval">Interval (hours)</label>
                  <input
                    id="frequency-interval"
                    type="number"
                    min="1"
                    max="8760"
                    value={frequencyInterval}
                    onChange={(e) => setFrequencyInterval(parseInt(e.target.value) || 24)}
                  />
                </div>
              )}

              <div className="form-actions">
                <button
                  className="save-button"
                  onClick={handleSaveSettings}
                  disabled={!name.trim()}
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="questions-tab">
              {activeQuestions.length === 0 && !showAddQuestion && (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  </div>
                  <h3>No Questions Yet</h3>
                  <p>Add questions to start collecting structured responses.</p>
                </div>
              )}

              {activeQuestions.length > 0 && (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="questions">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="questions-list"
                      >
                        {activeQuestions.map((question, index) => (
                          <Draggable
                            key={question.id}
                            draggableId={question.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="question-item"
                              >
                                <div
                                  {...provided.dragHandleProps}
                                  className="question-drag-handle"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="6" x2="21" y2="6"></line>
                                    <line x1="3" y1="12" x2="21" y2="12"></line>
                                    <line x1="3" y1="18" x2="21" y2="18"></line>
                                  </svg>
                                </div>

                                <div className="question-content">
                                  <h4 className="question-text">{question.text}</h4>
                                  <div className="question-meta">
                                    <span className="question-scale">{getScaleLabel(question.scaleType)}</span>
                                    {question.subscribedButtonIds.length > 0 && (
                                      <span className="question-buttons">
                                        Tracks: {question.subscribedButtonIds.length} button{question.subscribedButtonIds.length !== 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="question-actions">
                                  <button
                                    className="edit-question-button"
                                    onClick={() => handleEditQuestion(question)}
                                    title="Edit question"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                    </svg>
                                  </button>
                                  <button
                                    className="archive-question-button"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to archive "${question.text}"?`)) {
                                        onArchiveQuestion(questionnaireId, question.id);
                                      }
                                    }}
                                    title="Archive question"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                      <rect x="1" y="3" width="22" height="5"></rect>
                                      <line x1="10" y1="12" x2="14" y2="12"></line>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}

              {showAddQuestion && (
                <div className="add-question-form">
                  <h3>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h3>

                  <div className="form-group">
                    <label htmlFor="question-text">Question *</label>
                    <textarea
                      id="question-text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="e.g., How would you rate your mood today?"
                      maxLength={500}
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="question-scale">Scale Type *</label>
                    <select
                      id="question-scale"
                      value={newQuestionScale}
                      onChange={(e) => setNewQuestionScale(e.target.value as QuestionScaleType)}
                    >
                      <option value="binary">Yes/No</option>
                      <option value="five-point">5-point scale (-2 to +2)</option>
                      <option value="seven-point">7-point scale (-3 to +3)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tracked Buttons (Optional)</label>
                    <p className="form-help">Select buttons to show their data when viewing responses</p>
                    {availableButtons.length > 0 ? (
                      <div className="button-selector">
                        {availableButtons.map(button => (
                          <label key={button.id} className="button-option">
                            <input
                              type="checkbox"
                              checked={newQuestionButtonIds.includes(button.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewQuestionButtonIds([...newQuestionButtonIds, button.id]);
                                } else {
                                  setNewQuestionButtonIds(newQuestionButtonIds.filter(id => id !== button.id));
                                }
                              }}
                            />
                            <span className="button-label">
                              {button.text}
                              <span className="button-screen">({button.screenName})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="no-buttons-message">No tracker buttons available</p>
                    )}
                  </div>

                  <div className="form-actions">
                    <button className="cancel-button" onClick={handleCancelQuestion}>
                      Cancel
                    </button>
                    <button
                      className="save-button"
                      onClick={editingQuestionId ? handleUpdateQuestion : handleAddQuestion}
                      disabled={!newQuestionText.trim()}
                    >
                      {editingQuestionId ? 'Update Question' : 'Add Question'}
                    </button>
                  </div>
                </div>
              )}

              {!showAddQuestion && (
                <div className="questions-footer">
                  <button
                    className="add-question-button"
                    onClick={() => setShowAddQuestion(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Question
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}