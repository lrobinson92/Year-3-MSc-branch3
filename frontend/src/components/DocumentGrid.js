import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatDate } from '../utils/utils';
import { connect } from 'react-redux';
import GoogleDriveAuthCheck from './GoogleDriveAuthCheck';

const DocumentGrid = ({ 
    documents, 
    emptyMessage = "No documents available", 
    limit = null,
    showCreateButton = false,
    teamId = null,
    showTeamName = true,
    cardClass = "document-card",
    onDocumentClick = null,
    driveLoggedIn // Add this prop
}) => {
    const navigate = useNavigate();
    
    // If limit is set, only show that many documents
    const displayDocs = limit ? documents.slice(0, limit) : documents;
    
    // Handle document click with default behavior or custom handler
    const handleDocumentClick = (doc) => {
        if (!doc || !doc.id) {
            console.error('Cannot navigate: Document ID is missing', doc);
            return;
        }

        // Check if user is logged into Google Drive before navigating
        if (!driveLoggedIn) {
            // Store the document ID to return to after authentication
            sessionStorage.setItem('pendingDocumentView', doc.id);
            alert("Please connect to Google Drive first to view this document.");
            return;
        }
        
        if (onDocumentClick) {
            onDocumentClick(doc);
        } else {
            // Default behavior - navigate to document view
            navigate(`/view/sop/${doc.id}`);
        }
    };
    
    if (!documents || documents.length === 0) {
        return (
            <div>
                {showCreateButton && (
                    <GoogleDriveAuthCheck>
                        <div className="d-flex justify-content-end mb-3">
                            <Link 
                                to={teamId ? `/create-document?teamId=${teamId}` : "/create-document"} 
                                className="btn btn-primary"
                            >
                                + Add Document
                            </Link>
                        </div>
                    </GoogleDriveAuthCheck>
                )}
                <p>{emptyMessage}</p>
            </div>
        );
    }
    
    return (
        <div>
            {showCreateButton && (
                <GoogleDriveAuthCheck>
                    <div className="d-flex justify-content-end mb-3">
                        <Link 
                            to={teamId ? `/create-document?teamId=${teamId}` : "/create-document"} 
                            className="btn btn-primary"
                        >
                            + Add Document
                        </Link>
                    </div>
                </GoogleDriveAuthCheck>
            )}
            <div className="row">
                {displayDocs.map(doc => (
                    <div className="col-md-4 mb-3" key={doc.id}>
                        <div 
                            className={`card p-3 ${cardClass}`} 
                            onClick={() => handleDocumentClick(doc)}
                            style={{ 
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s'
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
                            <h4>{doc.title || doc.name}</h4>
                            {doc.description && <p className="doc-description">{doc.description}</p>}
                            {showTeamName && (
                                <p className="doc-team">
                                    {doc.team_name ? `Team: ${doc.team_name}` : "Personal Document"}
                                </p>
                            )}
                            <small>Last updated: {formatDate(doc.updated_at || doc.created_at)}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    driveLoggedIn: state.googledrive.driveLoggedIn
});

export default connect(mapStateToProps)(DocumentGrid);