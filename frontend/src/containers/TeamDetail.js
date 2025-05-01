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

/**
 * TeamDetail Component
 * 
 * Displays comprehensive information about a team including:
 * - Team details (name, description)
 * - Team members list
 * - Team tasks
 * - Team documents
 * 
 * Provides functionality for team management including inviting members,
 * creating tasks, adding documents, and document deletion.
 */
const TeamDetail = ({ isAuthenticated, user, fetchTeams, driveLoggedIn }) => {
    // Get team ID from URL parameters
    const { teamId } = useParams();
    const navigate = useNavigate();
    
    // State for team data
    const [team, setTeam] = useState(null);           // Team details
    const [members, setMembers] = useState([]);       // Team members list
    const [tasks, setTasks] = useState([]);           // All team tasks
    const [filteredTasks, setFilteredTasks] = useState([]); // Active/upcoming tasks
    const [documents, setDocuments] = useState([]);   // Team documents
    
    // UI state
    const [loading, setLoading] = useState(true);     // Loading indicator
    const [error, setError] = useState(null);         // Error message
    
    // Document deletion state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(null);

    /**
     * Handle document click with Google Drive authentication check
     * Redirects to Google auth if not logged in, or to document viewer if logged in
     */
    const handleDocumentClick = (doc) => {
        if (!driveLoggedIn) {
            // Save the current URL for returning after login
            redirectToGoogleDriveLogin(window.location.pathname);
        } else {
            // Navigate to the document viewer if already logged in
            navigate(`/view/sop/${doc.id}`);
        }
    };
    
    /**
     * Check if current user has permission to delete a document
     * Returns true if user is document owner or team owner
     */
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

    /**
     * Handle delete button click
     * Sets up the document deletion modal
     */
    const handleDeleteClick = (document) => {
        setDocumentToDelete(document);
        setShowDeleteModal(true);
        setDeleteError(null);
    };

    /**
     * Handle document deletion confirmation
     * Sends delete request to API and updates UI on success
     */
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

    // Document action handlers passed to DocumentGrid component
    const documentActions = {
        onDelete: handleDeleteClick,
        canDelete: canDeleteDocument
    };

    /**
     * Fetch team data on component mount
     * Includes team details, members, tasks, and documents
     */
    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                // Fetch updated teams list first
                await fetchTeams();

                // Fetch team details including members
                const teamRes = await axiosInstance.get(
                    `${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`, 
                    { withCredentials: true }
                );
                setTeam(teamRes.data);
                setMembers(teamRes.data.members);

                // Fetch all tasks and filter for current team
                const tasksRes = await axiosInstance.get(
                    `${process.env.REACT_APP_API_URL}/api/tasks/`, 
                    { withCredentials: true }
                );
                const teamTasks = tasksRes.data.filter(task => task.team === parseInt(teamId));
                setTasks(teamTasks);

                // Fetch team documents
                try {
                    const docsRes = await axiosInstance.get(
                        `${process.env.REACT_APP_API_URL}/api/documents/team/${teamId}/`, 
                        { withCredentials: true }
                    );
                    setDocuments(docsRes.data);
                } catch (docError) {
                    // Set documents to empty array if there's an error
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

    /**
     * Filter tasks to show only active and upcoming tasks
     * Removes completed tasks that are in the past
     */
    useEffect(() => {
        const today = new Date();

        const filterTasks = () => {
            if (!tasks) return [];

            return tasks.filter(task => {
                // Keep all non-completed tasks
                if (task.status !== 'complete') return true;

                // Keep completed tasks only if they're recent
                const dueDate = new Date(task.due_date);
                return dueDate > today;
            });
        };

        setFilteredTasks(filterTasks());
    }, [tasks]);

    /**
     * Check if current user is a team owner
     * Used for permission checks on UI elements
     */
    const isTeamOwner = () => {
        if (!team || !user) return false;
        const userMembership = team.members?.find(member => member.user === user.id);
        return userMembership?.role === 'owner';
    };

    // Redirect to login if not authenticated
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    // Show loading state
    if (loading) return (
        <div className="d-flex">
            <Sidebar />
            <div className="main-content d-flex justify-content-center align-items-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    );
    
    // Show error state
    if (error) return (
        <div className="d-flex">
            <Sidebar />
            <div className="main-content p-4">
                <div className="alert alert-danger">{error}</div>
                <Link to="/view/teams" className="btn btn-primary">Return to Teams</Link>
            </div>
        </div>
    );

    return (
        <div className="d-flex">
            {/* Sidebar navigation */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="main-content">
                <div className="recent-items-card">
                    {/* Team header section */}
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <h1>{team.name}</h1>
                    </div>
                    <p className="team-description mb-4">Description: {team.description}</p>

                    {/* Team members section */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <h3>Team Members</h3>
                            {/* Only show invite button for team owners */}
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
                        {/* Member avatars list */}
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

                    {/* Team tasks section */}
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
                        {/* Task table component */}
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

                    {/* Team documents section */}
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
                                {/* Create document button */}
                                <Link 
                                    to={`/create-document?teamId=${teamId}`} 
                                    className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                    title="Add New Document"
                                >
                                    <FaPlus className="me-1" /> Add Document
                                </Link>
                            </div>
                        </div>
                        {/* Document grid component */}
                        <DocumentGrid 
                            documents={documents}
                            emptyMessage="No documents found for this team"
                            showCreateButton={false}
                            teamId={teamId}
                            showTeamName={false}
                            onDocumentClick={handleDocumentClick}
                            driveLoggedIn={driveLoggedIn}
                            actions={documentActions}
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

/**
 * Maps Redux state to component props
 * Provides authentication status, user details, and Google Drive connection status
 */
const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    driveLoggedIn: state.googledrive.driveLoggedIn
});

/**
 * Connect component to Redux store
 */
export default connect(mapStateToProps, { fetchTeams })(TeamDetail);
