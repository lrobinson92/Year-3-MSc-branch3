import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';
import { FaArrowLeft } from 'react-icons/fa';
import { getTaskDetails, updateTask, fetchTeamMembers } from '../actions/task';
import { fetchTeams } from '../actions/team';

/**
 * EditTask Component - Form for editing existing tasks
 * Allows users to modify task details if they have permission
 */
const EditTask = ({ 
    isAuthenticated, 
    user, 
    updateTask, 
    getTaskDetails,
    fetchTeams,
    fetchTeamMembers,
    teams,
    teamMembers,
    currentTask,
    loading,
    isOwner
}) => {
    // Get task ID from URL parameters
    const { id } = useParams();
    const navigate = useNavigate();

    // Form state for task data
    const [formData, setFormData] = useState({
        description: '',
        assigned_to: user ? user.id : '',
        team: '',
        due_date: '',
        status: 'not_started',
    });
    
    // Permission state - determines if user can edit this task
    const [canEdit, setCanEdit] = useState(false);

    // Destructure form fields for easier access
    const { description, assigned_to, team, due_date, status } = formData;

    /**
     * Fetch task data and teams when component loads
     * Determine if the current user has permission to edit
     */
    useEffect(() => {
        const fetchTaskData = async () => {
            try {
                // Get task details from Redux action
                const taskData = await getTaskDetails(id);
                
                // Get teams list
                await fetchTeams();
                
                // Populate form with task data
                setFormData({
                    description: taskData.description || '',
                    assigned_to: taskData.assigned_to ? taskData.assigned_to.toString() : '',
                    team: taskData.team ? taskData.team.toString() : '',
                    due_date: taskData.due_date || '',
                    status: taskData.status || 'not_started',
                });
                
                // Check if user has permission to edit this task
                const isAssignedUser = taskData.assigned_to === user.id;
                
                // Use team_members data from the task to check ownership
                let isTeamOwner = false;
                if (taskData.team && taskData.team_members) {
                    const userMembership = taskData.team_members.find(
                        member => member.user === user.id
                    );
                    isTeamOwner = userMembership?.role === 'owner';
                }
                
                console.log('Permission check:', { 
                    isAssignedUser, 
                    isTeamOwner,
                    taskTeam: taskData.team,
                    team_members: taskData.team_members
                });
                
                setCanEdit(isAssignedUser || isTeamOwner);
                
            } catch (err) {
                console.error('Failed to fetch task or teams:', err);
            }
        };

        if (user && id) {
            fetchTaskData();
        }
    }, [id, user, getTaskDetails, fetchTeams]);

    /**
     * Fetch team members when team selection changes
     */
    useEffect(() => {
        if (user && team) {
            fetchTeamMembers(team, user.id);
        } else if (user) {
            // For personal tasks, just set the current user
            setFormData(prev => ({
                ...prev,
                assigned_to: user.id.toString()
            }));
        }
    }, [team, user, fetchTeamMembers]);

    /**
     * Handle form field changes
     * Special handling for team field to reset assigned_to when team changes
     */
    const onChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'team') {
            setFormData({ 
                ...formData, 
                [name]: value,
                // Reset assigned_to when team changes
                assigned_to: value ? '' : (user ? user.id : '')
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    /**
     * Form submission handler
     */
    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create task data object for API
            const taskData = {
                description,
                assigned_to,
                team: team || null,
                due_date,
                status
            };
            
            // Call Redux action to update the task
            await updateTask(id, taskData);
            alert("Task updated successfully!");
            navigate('/view/tasks');
        } catch (error) {
            alert("Failed to update task. Please try again.");
        }
    };

    // Navigate back to previous page
    const handleGoBack = () => {
        navigate(-1);
    };

    // Redirect if user is not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Show loading state while fetching data
    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5 entry-container">
            {/* Back button for navigation */}
            <FaArrowLeft 
                className="back-arrow" 
                onClick={handleGoBack} 
                style={{ cursor: 'pointer' }}
                title="Go back to previous page" 
            />
            
            {/* Task editing card */}
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <div className="d-flex align-items-center mb-4">
                    <h1 className="text-center flex-grow-1 mb-0">Edit Task</h1>
                </div>
                
                {/* Task editing form */}
                <form onSubmit={onSubmit}>
                    {/* Task description field */}
                    <div className="form-group mb-3">
                        <label>Description</label>
                        <textarea
                            className="form-control"
                            placeholder="Description"
                            name="description"
                            value={description}
                            onChange={onChange}
                            required
                            disabled={!canEdit}
                        />
                    </div>
                    
                    {/* Team selection */}
                    <div className="form-group mb-3">
                        <label>Team (Optional)</label>
                        <select
                            className="form-control"
                            name="team"
                            value={team}
                            onChange={onChange}
                            disabled={!canEdit}
                        >
                            <option value="">Personal Task</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Assigned user selection */}
                    <div className="form-group mb-3">
                        <label>Assigned To</label>
                        <select
                            className="form-control"
                            name="assigned_to"
                            value={assigned_to}
                            onChange={onChange}
                            required
                            disabled={!canEdit}
                        >
                            <option value="">Select Member</option>
                            {/* Show current user if it's a personal task */}
                            {!team && user && (
                                <option value={user.id}>{user.name}</option>
                            )}
                            {/* Show team members for team tasks */}
                            {team && teamMembers && teamMembers.map(member => (
                                <option key={member.user} value={member.user}>
                                    {member.user_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Due date selection */}
                    <div className="form-group mb-3">
                        <label>Due Date</label>
                        <input
                            type="date"
                            className="form-control"
                            name="due_date"
                            value={due_date}
                            onChange={onChange}
                            required
                            disabled={!canEdit}
                        />
                    </div>
                    
                    {/* Task status selection */}
                    <div className="form-group mb-3">
                        <label>Status</label>
                        <select
                            className="form-control"
                            name="status"
                            value={status}
                            onChange={onChange}
                            disabled={!canEdit}
                        >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="complete">Complete</option>
                        </select>
                    </div>
                    
                    {/* Show update button or permission message */}
                    {canEdit ? (
                        <div className="d-flex justify-content-between">
                            <button className="btn btn-primary w-100" type="submit">
                                Update Task
                            </button>
                        </div>
                    ) : (
                        <div className="alert alert-warning" role="alert">
                            You cannot update this task unless it is assigned to you or you are the team owner.
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

/**
 * Maps Redux state to component props
 */
const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    teams: state.team.teams || [],
    teamMembers: state.task.teamMembers || [],
    currentTask: state.task.currentTask,
    loading: state.task.loading,
    isOwner: state.task.isOwner
});

/**
 * Connects component to Redux store
 * Provides actions for task management
 */
export default connect(
    mapStateToProps, 
    { 
        updateTask, 
        getTaskDetails, 
        fetchTeams,
        fetchTeamMembers
    }
)(EditTask);