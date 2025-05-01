import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { getTaskDetails, updateTask, deleteTask } from '../actions/task';
import { fetchTeams } from '../actions/team';
import axiosInstance from '../utils/axiosConfig';
import Sidebar from '../components/Sidebar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { FaArrowLeft, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

/**
 * TaskDetail Component
 * 
 * Displays detailed information for a single task and provides functionality
 * for editing, completing, or deleting the task. Only users with appropriate
 * permissions can modify tasks (the task creator, team owners, or admins).
 * 
 * The component handles loading states, permission checks, and API interactions.
 */
const TaskDetail = ({ 
    getTaskDetails, 
    updateTask, 
    deleteTask, 
    fetchTeams,
    isAuthenticated, 
    user 
}) => {
    // Extract task ID from URL parameters
    const { taskId } = useParams();
    const navigate = useNavigate();
    
    // Task data state with default empty values
    const [taskData, setTaskData] = useState({
        description: '',
        assigned_to: '',
        team: '',
        due_date: '',
        status: 'not_started',
    });
    
    // UI state management
    const [teams, setTeams] = useState([]);                // List of teams user belongs to
    const [teamMembers, setTeamMembers] = useState([]);    // List of team members for selected team
    const [loading, setLoading] = useState(true);          // Loading state for initial data fetch
    const [error, setError] = useState(null);              // Error state for API failures
    const [isEditing, setIsEditing] = useState(false);     // Whether edit mode is active
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Delete confirmation modal visibility
    const [isDeleting, setIsDeleting] = useState(false);   // Loading state for delete operation
    const [originalTask, setOriginalTask] = useState(null); // Original task data for permission checks
    
    /**
     * Fetch task details and related data on component mount
     * Includes task details, teams list, and team members if applicable
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch task details
                const taskDetails = await getTaskDetails(taskId);
                setTaskData(taskDetails);
                setOriginalTask(taskDetails);
                
                // Fetch teams
                await fetchTeams();
                const teamsRes = await axiosInstance.get(
                    `${process.env.REACT_APP_API_URL}/api/teams/`, 
                    { withCredentials: true }
                );
                setTeams(teamsRes.data);
                
                // Fetch team members if task is associated with a team
                if (taskDetails.team) {
                    const teamMembersRes = await axiosInstance.get(
                        `${process.env.REACT_APP_API_URL}/api/teams/${taskDetails.team}/users-in-same-team/`, 
                        { withCredentials: true }
                    );
                    setTeamMembers(teamMembersRes.data);
                }
            } catch (err) {
                console.error('Error fetching task details:', err);
                setError('Failed to load task data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [taskId, getTaskDetails, fetchTeams]);
    
    /**
     * Update team members when team selection changes during editing
     * This ensures the assigned_to dropdown shows the correct members
     */
    useEffect(() => {
        // Update team members when team selection changes
        const fetchTeamMembers = async () => {
            if (taskData.team) {
                try {
                    const teamMembersRes = await axiosInstance.get(
                        `${process.env.REACT_APP_API_URL}/api/teams/${taskData.team}/users-in-same-team/`, 
                        { withCredentials: true }
                    );
                    setTeamMembers(teamMembersRes.data);
                } catch (err) {
                    console.error('Error fetching team members:', err);
                }
            } else {
                // Reset team members when no team is selected
                setTeamMembers([]);
            }
        };
        
        if (isEditing) {
            fetchTeamMembers();
        }
    }, [taskData.team, isEditing]);
    
    /**
     * Handle form field changes
     * Special handling for team selection to reset assigned_to
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Handle special case for team selection
        if (name === 'team') {
            setTaskData(prev => ({
                ...prev,
                [name]: value,
                // Reset assigned_to when team changes to prevent invalid assignments
                assigned_to: value ? '' : (user ? user.id : '')
            }));
        } else {
            setTaskData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };
    
    /**
     * Submit edited task data to the API
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await updateTask(taskId, taskData);
            setIsEditing(false);
            alert('Task updated successfully');
        } catch (err) {
            console.error('Error updating task:', err);
            alert('Failed to update task');
        }
    };
    
    /**
     * Handle task deletion after confirmation
     */
    const handleDelete = async () => {
        setIsDeleting(true);
        
        try {
            await deleteTask(taskId);
            setShowDeleteModal(false);
            navigate('/view/tasks');
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    };
    
    /**
     * Update only the task status
     * Used for quick status changes like marking complete
     */
    const handleStatusUpdate = async (newStatus) => {
        try {
            const updatedTask = { ...taskData, status: newStatus };
            await updateTask(taskId, updatedTask);
            setTaskData(updatedTask);
        } catch (err) {
            console.error('Error updating task status:', err);
            alert('Failed to update task status');
        }
    };
    
    /**
     * Check if current user has permission to edit this task
     * Returns true if user is the task creator, a team owner, or admin
     */
    const canEditTask = () => {
        if (!user || !originalTask) return false;
        
        // Personal task: user must be assigned to the task
        if (originalTask.assigned_to === user.id && !originalTask.team) {
            return true;
        }
        
        // Team task: check user's role in the team
        if (originalTask.team) {
            const userTeamMembership = teamMembers.find(member => member.user === user.id);
            // Team owners and admins can edit any team task
            return userTeamMembership && ['owner', 'admin'].includes(userTeamMembership.role);
        }
        
        return false;
    };
    
    /**
     * Format status text for display
     * Converts snake_case to Title Case
     */
    const formatStatus = (status) => {
        const statusMap = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'complete': 'Complete'
        };
        return statusMap[status] || status;
    };
    
    /**
     * Check if task is past due date
     * Returns true if due date is in the past and task is not complete
     */
    const isPastDue = () => {
        if (!taskData.due_date || taskData.status === 'complete') return false;
        const now = new Date();
        const due = new Date(taskData.due_date);
        return due < now;
    };
    
    // Show loading spinner while data is being fetched
    if (loading) {
        return (
            <div className="d-flex">
                <Sidebar />
                <div className="main-content d-flex justify-content-center align-items-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }
    
    // Show error message if data fetch failed
    if (error) {
        return (
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    <div className="alert alert-danger">{error}</div>
                    <Link to="/view/tasks" className="btn btn-primary">
                        <FaArrowLeft className="me-2" /> Back to Tasks
                    </Link>
                </div>
            </div>
        );
    }
    
    return (
        <div className="d-flex">
            {/* Sidebar navigation */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="main-content">
                <div className="container py-4">
                    {/* Header with navigation and action buttons */}
                    <div className="mb-4 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <Link to="/view/tasks" className="btn btn-outline-secondary me-3">
                                <FaArrowLeft /> Back
                            </Link>
                            <h1 className="mb-0">
                                {isEditing ? 'Edit Task' : 'Task Details'}
                            </h1>
                        </div>
                        
                        {/* Task action buttons - only shown when not editing and user has permissions */}
                        {!isEditing && canEditTask() && (
                            <div className="btn-group">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Task
                                </button>
                                <button 
                                    className="btn btn-danger"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    <FaTrash className="me-1" /> Delete
                                </button>
                                {taskData.status !== 'complete' && (
                                    <button 
                                        className="btn btn-success"
                                        onClick={() => handleStatusUpdate('complete')}
                                    >
                                        <FaCheck className="me-1" /> Mark Complete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Warning banner for overdue tasks */}
                    {isPastDue() && (
                        <div className="alert alert-danger d-flex align-items-center">
                            <FaExclamationTriangle className="me-2" />
                            <div>This task is past its due date and not yet complete.</div>
                        </div>
                    )}
                    
                    {/* Task edit form - displayed when isEditing is true */}
                    {isEditing ? (
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    {/* Task description field */}
                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">Description</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            className="form-control"
                                            value={taskData.description}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    
                                    {/* Team selection dropdown */}
                                    <div className="mb-3">
                                        <label htmlFor="team" className="form-label">Team (Optional)</label>
                                        <select
                                            id="team"
                                            name="team"
                                            className="form-select"
                                            value={taskData.team || ''}
                                            onChange={handleChange}
                                        >
                                            <option value="">Personal Task</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>{team.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Assigned user selection dropdown */}
                                    <div className="mb-3">
                                        <label htmlFor="assigned_to" className="form-label">Assigned To</label>
                                        <select
                                            id="assigned_to"
                                            name="assigned_to"
                                            className="form-select"
                                            value={taskData.assigned_to || ''}
                                            onChange={handleChange}
                                        >
                                            <option value="">Unassigned</option>
                                            {!taskData.team && user && (
                                                <option value={user.id}>{user.name}</option>
                                            )}
                                            {teamMembers.map(member => (
                                                <option key={member.user} value={member.user}>
                                                    {member.user_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Due date selection */}
                                    <div className="mb-3">
                                        <label htmlFor="due_date" className="form-label">Due Date</label>
                                        <input
                                            id="due_date"
                                            name="due_date"
                                            type="date"
                                            className="form-control"
                                            value={taskData.due_date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    
                                    {/* Status selection dropdown */}
                                    <div className="mb-3">
                                        <label htmlFor="status" className="form-label">Status</label>
                                        <select
                                            id="status"
                                            name="status"
                                            className="form-select"
                                            value={taskData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="not_started">Not Started</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="complete">Complete</option>
                                        </select>
                                    </div>
                                    
                                    {/* Form action buttons */}
                                    <div className="d-flex justify-content-end mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-secondary me-2"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* Task details view - displayed when not editing */
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <dl className="row">
                                    {/* Task description */}
                                    <dt className="col-sm-3">Description</dt>
                                    <dd className="col-sm-9">{taskData.description}</dd>
                                    
                                    {/* Team name */}
                                    <dt className="col-sm-3">Team</dt>
                                    <dd className="col-sm-9">
                                        {taskData.team_name || 'Personal Task'}
                                    </dd>
                                    
                                    {/* Assigned user */}
                                    <dt className="col-sm-3">Assigned To</dt>
                                    <dd className="col-sm-9">
                                        {taskData.assigned_to_name || 'Unassigned'}
                                    </dd>
                                    
                                    {/* Due date */}
                                    <dt className="col-sm-3">Due Date</dt>
                                    <dd className="col-sm-9">
                                        {new Date(taskData.due_date).toLocaleDateString()}
                                    </dd>
                                    
                                    {/* Status with colored badge */}
                                    <dt className="col-sm-3">Status</dt>
                                    <dd className="col-sm-9">
                                        <span className={`badge ${
                                            taskData.status === 'complete' ? 'bg-success' :
                                            taskData.status === 'in_progress' ? 'bg-primary' :
                                            'bg-secondary'
                                        }`}>
                                            {formatStatus(taskData.status)}
                                        </span>
                                    </dd>
                                    
                                    {/* Creation timestamp */}
                                    <dt className="col-sm-3">Created</dt>
                                    <dd className="col-sm-9">
                                        {new Date(taskData.created_at).toLocaleString()}
                                    </dd>
                                    
                                    {/* Last update timestamp */}
                                    <dt className="col-sm-3">Last Updated</dt>
                                    <dd className="col-sm-9">
                                        {new Date(taskData.updated_at).toLocaleString()}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Task</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to delete this task?</p>
                    <p className="text-danger">This action cannot be undone.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Deleting...
                            </>
                        ) : (
                            'Delete Task'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

/**
 * Maps Redux state to component props
 * Provides authentication status and user details
 */
const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user
});

/**
 * Connect component to Redux store
 * Provides access to actions and state
 */
export default connect(
    mapStateToProps, 
    { getTaskDetails, updateTask, deleteTask, fetchTeams }
)(TaskDetail);