import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import DocumentGrid from '../components/DocumentGrid';
import axiosInstance from '../utils/axiosConfig';
import { formatDate, toTitleCase } from '../utils/utils';
import { fetchTeams } from '../actions/team';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { redirectToGoogleDriveLogin } from '../utils/driveAuthUtils';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const TeamDetail = ({ isAuthenticated, user, fetchTeams, driveLoggedIn }) => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // Add document deletion state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    // Handle document click with Google Drive auth logic
    const handleDocumentClick = (doc) => {
        if (!driveLoggedIn) {
            // Save the current URL for returning after login
            redirectToGoogleDriveLogin(window.location.pathname);
        } else {
            // Navigate to the document viewer if already logged in
            navigate(`/view/sop/${doc.id}`);
        }
    };
    
    // Check if user can delete document
    const canDeleteDocument = (document) => {
        if (!user) return false;
        
        // User is document owner
        if (document.owner === user.id) return true;
        
        // User is team owner
        if (team) {
            const userMembership = team.members?.find(member => member.user === user.id);
            return userMembership?.role === 'owner';
        }
        
        return false;
    };

    // Handle delete button click
    const handleDeleteClick = (document) => {
        setDocumentToDelete(document);
        setShowDeleteModal(true);
        setDeleteError(null);
    };

    // Handle confirming document deletion
    const handleConfirmDelete = async () => {
        if (!documentToDelete) return;
        
        setIsDeleting(true);
        setDeleteError(null);
        
        try {
            await axiosInstance.delete(
                `${process.env.REACT_APP_API_URL}/api/documents/${documentToDelete.id}/`,
                { withCredentials: true }
            );
            
            // Update documents after deletion
            setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Error deleting document:', err);
            setDeleteError('Failed to delete document. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Document action handlers for DocumentGrid
    const documentActions = {
        onDelete: handleDeleteClick,
        canDelete: canDeleteDocument
    };

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                await fetchTeams();

                const teamRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`, { withCredentials: true });
                setTeam(teamRes.data);
                setMembers(teamRes.data.members);

                const tasksRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/tasks/`, { withCredentials: true });
                const teamTasks = tasksRes.data.filter(task => task.team === parseInt(teamId));
                setTasks(teamTasks);

                try {
                    const docsRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/documents/team/${teamId}/`, { withCredentials: true });
                    setDocuments(docsRes.data);
                } catch {
                    setDocuments([]);
                }
            } catch (err) {
                console.error('Error fetching team details:', err);
                setError('Failed to load team data');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [teamId, fetchTeams]);

    useEffect(() => {
        const today = new Date();

        const filterTasks = () => {
            if (!tasks) return [];

            return tasks.filter(task => {
                if (task.status !== 'complete') return true;

                const dueDate = new Date(task.due_date);
                return dueDate > today;
            });
        };

        setFilteredTasks(filterTasks());
    }, [tasks]);

    const isTeamOwner = () => {
        if (!team || !user) return false;
        const userMembership = team.members?.find(member => member.user === user.id);
        return userMembership?.role === 'owner';
    };

    if (!isAuthenticated) return <Navigate to="/login" />;
    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="d-flex">
            <Sidebar />
            <div className="main-content">
                <div className="recent-items-card">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <h1>{team.name}</h1>
                    </div>
                    <p className="team-description mb-4">Description: {team.description}</p>

                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <h3>Team Members</h3>
                            {isTeamOwner() && (
                                <Link 
                                    to={`/invite-member/${teamId}`} 
                                    className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                    title="Invite New Member"
                                >
                                    <FaPlus className="me-1" /> Invite Member
                                </Link>
                            )}
                        </div>
                        <ul className="member-list">
                            {members && members.map((member) => (
                                <li key={member.id}>
                                    <span
                                        className={`member-initial ${member.role === 'owner' ? 'owner-initial' : ''}`}
                                        title={`${member.user_name} (${toTitleCase(member.role)})`}
                                    >
                                        {member.user_name.charAt(0).toUpperCase()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="my-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2>Team Tasks</h2>
                            <Link 
                                to={`/create-task?teamId=${teamId}`} 
                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                            >
                                <FaPlus className="me-1" /> Create Task
                            </Link>
                        </div>
                        <TaskTable 
                            tasks={filteredTasks} 
                            emptyMessage="No active tasks for this team" 
                            showColumns={{ 
                                status: true, 
                                assignedTo: true, 
                                dueDate: true, 
                                actions: true 
                            }}
                        />
                    </div>

                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <h3>Documents</h3>
                            <div className="d-flex gap-2">
                                {/* Show Google Drive login button if not logged in */}
                                {!driveLoggedIn && (
                                    <button 
                                        className="btn btn-sm btn-secondary d-flex align-items-center"
                                        onClick={() => redirectToGoogleDriveLogin(window.location.pathname)}
                                    >
                                        <FcGoogle className="me-1" /> Connect Google Drive
                                    </button>
                                )}
                                <Link 
                                    to={`/create-document?teamId=${teamId}`} 
                                    className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                    title="Add New Document"
                                >
                                    <FaPlus className="me-1" /> Add Document
                                </Link>
                            </div>
                        </div>
                        <DocumentGrid 
                            documents={documents}
                            emptyMessage="No documents found for this team"
                            showCreateButton={false}
                            teamId={teamId}
                            showTeamName={false}
                            onDocumentClick={handleDocumentClick}
                            driveLoggedIn={driveLoggedIn}
                            actions={documentActions} // Pass document actions
                        />
                    </div>
                </div>
            </div>
            
            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Document</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete <strong>{documentToDelete?.title}</strong>?</p>
                    <p className="text-danger">This action cannot be undone.</p>
                    {deleteError && <div className="alert alert-danger mt-3">{deleteError}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Deleting...
                            </>
                        ) : (
                            'Delete Document'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    driveLoggedIn: state.googledrive.driveLoggedIn
});

export default connect(mapStateToProps, { fetchTeams })(TeamDetail);
