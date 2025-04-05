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

const TaskDetail = ({ 
    getTaskDetails, 
    updateTask, 
    deleteTask, 
    fetchTeams,
    isAuthenticated, 
    user 
}) => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    
    const [taskData, setTaskData] = useState({
        description: '',
        assigned_to: '',
        team: '',
        due_date: '',
        status: 'not_started',
    });
    
    const [teams, setTeams] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [originalTask, setOriginalTask] = useState(null);
    
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
                setTeamMembers([]);
            }
        };
        
        if (isEditing) {
            fetchTeamMembers();
        }
    }, [taskData.team, isEditing]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Handle special case for team selection
        if (name === 'team') {
            setTaskData(prev => ({
                ...prev,
                [name]: value,
                // Reset assigned_to when team changes
                assigned_to: value ? '' : (user ? user.id : '')
            }));
        } else {
            setTaskData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };
    
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
    
    // Check if user can edit this task
    const canEditTask = () => {
        if (!user || !originalTask) return false;
        
        // If it's a personal task assigned to the user
        if (originalTask.assigned_to === user.id && !originalTask.team) {
            return true;
        }
        
        // If it's a team task and user is a team member
        if (originalTask.team) {
            const userTeamMembership = teamMembers.find(member => member.user === user.id);
            // Team owners and admins can edit any team task
            return userTeamMembership && ['owner', 'admin'].includes(userTeamMembership.role);
        }
        
        return false;
    };
    
    // Helper to format status text
    const formatStatus = (status) => {
        const statusMap = {
            'not_started': 'Not Started',
            'in_progress': 'In Progress',
            'complete': 'Complete'
        };
        return statusMap[status] || status;
    };
    
    // Helper to check if task is past due
    const isPastDue = () => {
        if (!taskData.due_date || taskData.status === 'complete') return false;
        const now = new Date();
        const due = new Date(taskData.due_date);
        return due < now;
    };
    
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
            <Sidebar />
            <div className="main-content">
                <div className="container py-4">
                    <div className="mb-4 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <Link to="/view/tasks" className="btn btn-outline-secondary me-3">
                                <FaArrowLeft /> Back
                            </Link>
                            <h1 className="mb-0">
                                {isEditing ? 'Edit Task' : 'Task Details'}
                            </h1>
                        </div>
                        
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
                    
                    {isPastDue() && (
                        <div className="alert alert-danger d-flex align-items-center">
                            <FaExclamationTriangle className="me-2" />
                            <div>This task is past its due date and not yet complete.</div>
                        </div>
                    )}
                    
                    {isEditing ? (
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
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
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <dl className="row">
                                    <dt className="col-sm-3">Description</dt>
                                    <dd className="col-sm-9">{taskData.description}</dd>
                                    
                                    <dt className="col-sm-3">Team</dt>
                                    <dd className="col-sm-9">
                                        {taskData.team_name || 'Personal Task'}
                                    </dd>
                                    
                                    <dt className="col-sm-3">Assigned To</dt>
                                    <dd className="col-sm-9">
                                        {taskData.assigned_to_name || 'Unassigned'}
                                    </dd>
                                    
                                    <dt className="col-sm-3">Due Date</dt>
                                    <dd className="col-sm-9">
                                        {new Date(taskData.due_date).toLocaleDateString()}
                                    </dd>
                                    
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
                                    
                                    <dt className="col-sm-3">Created</dt>
                                    <dd className="col-sm-9">
                                        {new Date(taskData.created_at).toLocaleString()}
                                    </dd>
                                    
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

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user
});

export default connect(
    mapStateToProps, 
    { getTaskDetails, updateTask, deleteTask, fetchTeams }
)(TaskDetail);