import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { formatDate } from '../utils/utils';

const DocumentGrid = ({ 
    documents, 
    emptyMessage = "No documents available", 
    limit = null,
    showCreateButton = false,
    teamId = null,
    showTeamName = true,
    cardClass = "document-card"
}) => {
    const navigate = useNavigate();
    
    // If limit is set, only show that many documents
    const displayDocs = limit ? documents.slice(0, limit) : documents;
    
    if (!documents || documents.length === 0) {
        return (
            <div>
                {showCreateButton && (
                    <div className="d-flex justify-content-end mb-3">
                        <Link 
                            to={teamId ? `/create-document?teamId=${teamId}` : "/create-document"} 
                            className="btn btn-primary"
                        >
                            + Add Document
                        </Link>
                    </div>
                )}
                <p>{emptyMessage}</p>
            </div>
        );
    }
    
    return (
        <div>
            {showCreateButton && (
                <div className="d-flex justify-content-end mb-3">
                    <Link 
                        to={teamId ? `/create-document?teamId=${teamId}` : "/create-document"} 
                        className="btn btn-primary"
                    >
                        + Add Document
                    </Link>
                </div>
            )}
            <div className="row">
                {displayDocs.map(doc => (
                    <div className="col-md-4 mb-3" key={doc.id}>
                        <div 
                            className={`card p-3 ${cardClass}`} 
                            onClick={() => navigate(`/document/${doc.id}`)}
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

export default DocumentGrid;