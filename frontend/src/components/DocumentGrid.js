import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/utils';
import GoogleDriveAuthCheck from './GoogleDriveAuthCheck';
import { redirectToGoogleDriveLogin } from '../utils/driveAuthUtils';

const DocumentGrid = ({ 
    documents, 
    emptyMessage = "No documents available", 
    limit = null,
    showCreateButton = false,
    teamId = null,
    showTeamName = true,
    cardClass = "document-card",
    onDocumentClick = null,
    driveLoggedIn = true 
}) => {
    const navigate = useNavigate();
    const displayDocs = limit ? documents?.slice(0, limit) : documents;
    
    // Handle document click with Google Drive auth logic
    const handleDocumentClick = (doc) => {
        if (onDocumentClick) {
            // Use the custom handler if provided
            onDocumentClick(doc);
        } else {
            // Default behavior
            if (!driveLoggedIn) {
                // Redirect to login
                redirectToGoogleDriveLogin(`/view/sop/${doc.id}`);
            } else {
                // Navigate to document
                navigate(`/view/sop/${doc.id}`);
            }
        }
    };
    
    if (!documents || documents.length === 0) {
        return (
            <div className="text-center py-5">
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
                            {doc.review_date && (
                                <div className="text-muted small mt-1">
                                    <strong>Review date:</strong> {formatDate(doc.review_date)}
                                    {doc.days_until_review <= 14 && doc.days_until_review > 0 && (
                                        <span className="badge bg-warning ms-2">Review soon</span>
                                    )}
                                    {doc.days_until_review <= 0 && (
                                        <span className="badge bg-danger ms-2">Review overdue</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentGrid;