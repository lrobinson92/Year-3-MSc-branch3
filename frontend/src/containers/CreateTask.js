import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { createTask, fetchTeamMembers } from '../actions/task';
import { fetchTeams } from '../actions/team';
import { FaArrowLeft } from 'react-icons/fa';

// This component is a form for creating new tasks
const CreateTask = ({ 
    createTask, 
    fetchTeams,
    fetchTeamMembers,
    isAuthenticated, 
    user,
    teams,
    teamMembers,
    teamsLoading,
    teamMembersLoading
}) => {
    // Store and track the task information entered by user
    const [formData, setFormData] = useState({
        description: '',
        assigned_to: user ? user.id : '',
        team: '',
        due_date: '',
        status: 'not_started',
    });

    // Extract values from the form data for easier access
    const { description, assigned_to, team, due_date, status } = formData;
    const navigate = useNavigate();

    // When component loads, fetch teams
    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    // When team selection changes, fetch members
    useEffect(() => {
        if (user) {
            fetchTeamMembers(team, user.id);
        }
    }, [team, user, fetchTeamMembers]);

    // When user data loads, update the form to assign task to current user
    useEffect(() => {
        if (user) {
            setFormData(prevFormData => ({
                ...prevFormData,
                assigned_to: user.id
            }));
        }
    }, [user]);

    // Function to update form data when user changes fields
    const onChange = (e) => {
        const { name, value } = e.target;
        
        setFormData((prevState) => ({
          ...prevState,
          [name]: value,
          // If team changes, reset assigned_to field
          ...(name === 'team'
            ? { assigned_to: value ? '' : (user ? user.id : '') }
            : {})
        }));
      };

    // Function that runs when the form is submitted
    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            // Send the task information to the server
            await createTask({ description, assigned_to, team, due_date, status });
            // Show success message
            alert("Task created successfully!");
            // Redirect to tasks page
            navigate('/view/tasks');
        } catch (error) {
            // Show error message if task creation fails
            alert("Failed to create task. Please try again.");
        }
    };

    // If user is not logged in, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Function to handle the back button click
    const handleGoBack = () => {
        navigate(-1); // Go back to previous page
    };

    return (
        <div className="container mt-5 entry-container">
            {/* Back button */}
            <FaArrowLeft 
                className="back-arrow" 
                onClick={handleGoBack} 
                style={{ cursor: 'pointer' }}
                title="Go back to previous page" 
            />
            {/* Task creation form card */}
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <h1 className="text-center mb-4">Create Task</h1>
                <form onSubmit={onSubmit}>
                    {/* Task description input */}
                    <div className="form-group mb-3">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className="form-control"
                            placeholder="Description"
                            name="description"
                            value={description}
                            onChange={onChange}
                            required
                        />
                    </div>
                    {/* Team selection dropdown */}
                    <div className="form-group mb-3">
                        <label htmlFor="team">Team (Optional)</label>
                        <select
                            id="team"
                            className="form-control"
                            name="team"
                            value={team}
                            onChange={onChange}
                        >
                            <option value="">Personal Task</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    {/* Assigned user selection dropdown */}
                    <div className="form-group mb-3">
                        <label htmlFor="assigned_to">Assigned To</label>
                        <select
                            id="assigned_to"
                            className="form-control"
                            name="assigned_to"
                            value={assigned_to}
                            onChange={onChange}
                            required
                        >
                            <option value="">Select Member</option>
                            {/* Show current user for personal tasks */}
                            {!team && user && (
                                <option value={user.id}>{user.name}</option>
                            )}
                            {/* Show team members from Redux state */}
                            {teamMembers.map(member => (
                                member && member.user && member.user_name ? (
                                    <option key={member.user} value={member.user}>
                                        {member.user_name}
                                    </option>
                                ) : null
                            ))}
                        </select>
                    </div>
                    {/* Due date selection */}
                    <div className="form-group mb-3">
                        <label htmlFor="due_date">Due Date</label>
                        <input
                            id="due_date"
                            type="date"
                            className="form-control"
                            name="due_date"
                            value={due_date}
                            onChange={onChange}
                            required
                        />
                    </div>
                    {/* Task status dropdown */}
                    <div className="form-group mb-3">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            className="form-control"
                            name="status"
                            value={status}
                            onChange={onChange}
                        >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="complete">Complete</option>
                        </select>
                    </div>
                    {/* Submit button */}
                    <button className="btn btn-primary w-100" type="submit">
                        Create Task
                    </button>
                </form>
            </div>
        </div>
    );
};

// Connect component to Redux state management
const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
    teams: state.team.teams,
    teamsLoading: state.team.loading,
    teamMembers: state.task.teamMembers,
    teamMembersLoading: state.task.loading,
});

export default connect(mapStateToProps, { 
    createTask, 
    fetchTeams,
    fetchTeamMembers 
})(CreateTask);