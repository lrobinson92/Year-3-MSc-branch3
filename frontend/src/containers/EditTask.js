import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';
import { FaArrowLeft } from 'react-icons/fa';
import { editTask } from '../actions/task';

const EditTask = ({ isAuthenticated, user, editTask }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        description: '',
        assigned_to: user ? user.id : '',
        team: '',
        due_date: '',
        status: 'not_started',
    });
    const [teams, setTeams] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [canEdit, setCanEdit] = useState(false);

    const { description, assigned_to, team, due_date, status } = formData;

    useEffect(() => {
        const fetchTaskAndData = async () => {
            try {
                // Cookies are automatically sent in requests because `withCredentials: true` is enabled.
                const taskListURL = `${process.env.REACT_APP_API_URL}/api/tasks/user-and-team-tasks/`;
                const teamsURL = `${process.env.REACT_APP_API_URL}/api/teams/`;
        
                const [tasksRes, teamsRes] = await Promise.all([
                    axiosInstance.get(taskListURL),
                    axiosInstance.get(teamsURL),
                ]);
        
                // 🔥 Find the task with the correct ID
                const allTasks = [...tasksRes.data.user_tasks, ...tasksRes.data.team_tasks];
                const taskData = allTasks.find(task => task.id === parseInt(id));
        
                if (!taskData) {
                    console.error("❌ Task not found in response.");
                    return;
                }

                console.log("🔍 Task Data:", taskData);
                console.log("🔍 Task Assigned To:", taskData.assigned_to);
                console.log("🔍 Setting Assigned To: ", taskData.assigned_to ? taskData.assigned_to.toString() : '');

                // ✅ Populate the form with task data
                setFormData({
                    description: taskData.description || '',
                    assigned_to: taskData.assigned_to ? taskData.assigned_to.toString() : '',
                    team: taskData.team ? taskData.team.toString() : '',
                    due_date: taskData.due_date || '',
                    status: taskData.status || 'not_started',
                });
        
                setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);

                const isAssignedUser = taskData.assigned_to === user.id;
                const isOwner = teamsRes.data.some(team => 
                    team.id === taskData.team && 
                    team.members.some(membership => membership.user === user.id && membership.role === 'owner')
                );
                setCanEdit(isAssignedUser || isOwner);
        
            } catch (err) {
                console.error('❌ Failed to fetch task or teams:', err);
            }
        };
        


        fetchTaskAndData();
    }, [id, user.id]);

    useEffect(() => {
        // Fetch users based on the selected team
        const fetchUsers = async () => {
            if (team) {
                try {
                    const usersRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/${team}/users-in-same-team/`, { withCredentials: true });
                    console.log('Fetched users:', usersRes.data); // Debugging log
                    setFilteredUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
                } catch (err) {
                    console.error('Failed to fetch users:', err);
                }
            } else {
                setFilteredUsers([{
                    user: user.id,
                    user_name: `${user.name || user.email}`
                }]);
            }
        };

        fetchUsers();
    }, [team, user]);

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

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await editTask(id, description, assigned_to, team, due_date, status);
            alert("Task updated successfully!");
            navigate('/view/tasks');
        } catch (error) {
            alert("Failed to update task. Please try again.");
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div className="container mt-5 entry-container">
            <FaArrowLeft className="back-arrow" onClick={() => navigate('/view/tasks')} />
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <div className="d-flex align-items-center mb-4">
                    <h1 className="text-center flex-grow-1 mb-0">Edit Task</h1>
                </div>
                <form onSubmit={onSubmit}>
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
                            {filteredUsers.map(user => (
                                <option key={user.user} value={user.user}>
                                    {user.user_name}
                                </option>
                            ))}
                        </select>
                    </div>
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

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
});

export default connect(mapStateToProps, { editTask })(EditTask);