import '../styles/ConfirmationDialog.css';

interface ConfirmationDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({ 
  title, 
  message, 
  onConfirm, 
  onCancel 
}: ConfirmationDialogProps) {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirmation-actions">
          <button 
            className="confirmation-button confirmation-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="confirmation-button confirmation-confirm"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
} 