import '../styles/ImportDialog.css';

interface ImportDialogProps {
  trackerName: string;
  onReplace: () => void;
  onMerge: () => void;
  onCancel: () => void;
}

export default function ImportDialog({ 
  trackerName, 
  onReplace, 
  onMerge, 
  onCancel 
}: ImportDialogProps) {
  return (
    <div className="import-overlay">
      <div className="import-dialog">
        <h2>Import Tracker</h2>
        <p>
          A tracker with the same ID already exists: <strong>{trackerName}</strong>
        </p>
        <p>Choose how you want to import this tracker:</p>
        
        <div className="import-options">
          <div className="import-option">
            <h3>Replace</h3>
            <p>Replace the existing tracker with the imported data. All existing data will be lost.</p>
            <button 
              className="import-button import-replace"
              onClick={onReplace}
            >
              Replace
            </button>
          </div>
          
          <div className="import-option">
            <h3>Merge</h3>
            <p>Combine the imported data with your existing tracker. All buttons and clicks will be merged.</p>
            <button 
              className="import-button import-merge"
              onClick={onMerge}
            >
              Merge
            </button>
          </div>
        </div>
        
        <button 
          className="import-button import-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 