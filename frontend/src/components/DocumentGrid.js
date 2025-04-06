import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/utils';
import { FaTrash, FaEye, FaEdit, FaEllipsisV } from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';

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
  actions = {}
}) => {
  const navigate = useNavigate();
  const displayDocs = limit ? documents?.slice(0, limit) : documents;
  
  // Custom toggle for dropdown to prevent card click when opening dropdown
  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <button
      ref={ref}
      className="btn btn-link text-dark p-0 m-0"
      style={{ 
        position: 'absolute', 
        top: '8px', 
        right: '8px',
        background: 'transparent',
        border: 'none',
        zIndex: 2
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      <FaEllipsisV size={14} />
    </button>
  ));
  
  // Handle document click with Google Drive auth logic
  const handleDocumentClick = (doc) => {
    if (onDocumentClick) {
      // Use the custom handler if provided
      onDocumentClick(doc);
    } else {
      // Default behavior - navigate to document
      navigate(`/view/sop/${doc.id}`);
    }
  };
  
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-muted">{emptyMessage}</p>
        {showCreateButton && (
          <Link 
            to={teamId ? `/create-document?teamId=${teamId}` : "/create-document"} 
            className="btn btn-primary mt-3"
          >
            + Add Document
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
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
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Actions Dropdown */}
              <Dropdown>
                <Dropdown.Toggle as={CustomToggle} id={`dropdown-${doc.id}`} />
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
                  {actions.canDelete && actions.onDelete && actions.canDelete(doc) && (
                    <Dropdown.Item 
                      className="text-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.onDelete(doc);
                      }}
                    >
                      <FaTrash className="me-2" /> Delete
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>

              {/* Document Content */}
              <div 
                onClick={() => handleDocumentClick(doc)}
                style={{ 
                  cursor: 'pointer',
                  marginTop: '6px' // Reduce space above title
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
                    <small>Review: {formatDate(doc.review_date)}</small>
                    {doc.days_until_review <= 14 && doc.days_until_review > 0 && (
                      <span className="badge bg-warning ms-1 text-dark" style={{ fontSize: '0.65rem' }}>Review soon</span>
                    )}
                    {doc.days_until_review <= 0 && (
                      <span className="badge bg-danger ms-1 text-dark" style={{ fontSize: '0.65rem' }}>Review overdue</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentGrid;