import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { FaEye, FaEdit, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { Dropdown, Toast, ToastContainer } from 'react-bootstrap';
import { deleteDocument } from '../actions/googledrive';
import CustomToggle from '../utils/customToggle';

/**
 * DocumentGrid Component
 * 
 * Displays a responsive grid of document cards with actions like view, edit, and delete.
 * Supports custom display options and integration with Google Drive.
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.documents - List of document objects to display
 * @param {string} props.emptyMessage - Message to show when no documents exist
 * @param {number} props.limit - Optional limit for number of documents to show
 * @param {boolean} props.showCreateButton - Whether to show document creation button
 * @param {string|number} props.teamId - Optional team ID for filtering documents
 * @param {boolean} props.showTeamName - Whether to display team name on document cards
 * @param {string} props.cardClass - CSS class for document cards
 * @param {Function} props.onDocumentClick - Custom handler for document clicks
 * @param {boolean} props.driveLoggedIn - Whether user is authenticated with Google Drive
 * @param {Object} props.actions - Custom action handlers and permission checks
 * @param {Function} props.deleteDocument - Redux action for deleting documents
 */
const DocumentGrid = ({ 
  documents,
  emptyMessage = "No documents available", 
  limit = null,
  showCreateButton = false,
  teamId = null,
  showTeamName = true,
  cardClass = "document-card",
  onDocumentClick = null,
  driveLoggedIn = true,
  actions = {},
  deleteDocument
}) => {
  // Hook for programmatic navigation
  const navigate = useNavigate();
  
  // State for toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  /**
   * Handle document deletion with confirmation
   * Uses either custom handler from props or Redux action
   * 
   * @param {Event} e - Click event
   * @param {Object} doc - Document to delete
   */
  const handleDeleteDocument = async (e, doc) => {
    e.stopPropagation(); // Prevent triggering document click event
    
    // User confirmation before deletion
    if (!window.confirm(`Are you sure you want to delete "${doc.title || doc.name}"?`)) {
      return;
    }
    
    // If actions provides a custom delete handler, use that
    if (actions.onDelete) {
      actions.onDelete(doc);
      // Show toast notification for custom handler too
      setToastMessage(`"${doc.title || doc.name}" has been deleted`);
      setShowToast(true);
      return;
    }
    
    // Otherwise use the Redux action
    const success = await deleteDocument(doc.id);
    
    if (success) {
      // Show toast notification for successful deletion
      setToastMessage(`"${doc.title || doc.name}" has been deleted`);
      setShowToast(true);
    }
  };

  /**
   * Format dates for display in a consistent format
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Limit documents if specified
  const displayDocs = limit ? documents.slice(0, limit) : documents;
  
  /**
   * Handle document click event
   * Navigates to document view or calls custom handler
   * 
   * @param {Object} doc - Document object
   */
  const handleDocumentClick = (doc) => {
    if (onDocumentClick) {
      onDocumentClick(doc);
    } else {
      navigate(`/view/sop/${doc.id}`);
    }
  };

  return (
    <div>
      {/* Toast notification for successful deletion */}
      <ToastContainer 
        position="top-end" 
        className="p-3" 
        style={{ zIndex: 1100 }}
      >
        <Toast 
          onClose={() => setShowToast(false)} 
          show={showToast} 
          delay={3000} 
          autohide
          bg="success"
        >
          <Toast.Header closeButton>
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {displayDocs.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="row">
          {displayDocs.map(doc => (
            <div className="col-md-2 mb-3" key={doc.id}>
              <div 
                className={`card ${cardClass}`} 
                style={{ 
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  height: '150px',
                  overflow: 'hidden',
                  padding: '0.75rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.08)';
                }}
              >
                {/* Dropdown Menu */}
                <div style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '6px', 
                  zIndex: 2 
                }}>
                  <Dropdown>
                    <Dropdown.Toggle as={CustomToggle} id={`dropdown-${doc.id}`}>
                      ...
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" size="sm">
                      <Dropdown.Item onClick={() => handleDocumentClick(doc)}>
                        <FaEye className="me-2" /> View
                      </Dropdown.Item>
                      <Dropdown.Item 
                        as="a"
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaEdit className="me-2" /> Edit in Google Drive
                      </Dropdown.Item>
                      {(!actions.canDelete || (actions.canDelete && actions.canDelete(doc))) && (
                        <Dropdown.Item 
                          className="text-danger"
                          onClick={(e) => handleDeleteDocument(e, doc)}
                        >
                          <FaTrash className="me-2" /> Delete
                        </Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>

                {/* Document Content */}
                <div 
                  onClick={() => handleDocumentClick(doc)}
                  style={{ 
                    cursor: 'pointer',
                    marginTop: '24px' // Space above title
                  }}
                >
                  <h5 className="mb-2 text" style={{ fontSize: '1.2rem' }}>
                    {doc.title || doc.name}
                  </h5>
                  {showTeamName && (
                    <p className="doc-team mb-1 small text-truncate">
                      {doc.team_name ? `Team: ${doc.team_name}` : "Personal Document"}
                    </p>
                  )}
                  <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>
                    Updated: {formatDate(doc.updated_at || doc.created_at)}
                  </small>
                  {doc.review_date && (
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      <div className="d-flex align-items-center">
                        <span>Review: {formatDate(doc.review_date)}</span>
                        {doc.days_until_review <= 14 && doc.days_until_review > 0 && (
                          <span className="badge bg-warning ms-1 text-dark" style={{ fontSize: '0.65rem' }}>Review soon</span>
                        )}
                        {doc.days_until_review <= 0 && (
                          <span className="badge bg-danger ms-1 text-dark" style={{ fontSize: '0.65rem' }}>Review overdue</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default connect(null, { deleteDocument })(DocumentGrid);