import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import DocumentGrid from '../components/DocumentGrid';
import TeamGrid from '../components/TeamGrid'; // Import the new component
import { resetFirstLogin } from '../actions/auth';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';

const Dashboard = ({ isAuthenticated, firstLogin, resetFirstLogin, user }) => {
    const [tasks, setTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (firstLogin) {
            resetFirstLogin(); // Reset firstLogin state after visiting dashboard
        }
    }, [firstLogin, resetFirstLogin]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch tasks
                const tasksRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/tasks/user-and-team-tasks/`, { withCredentials: true });
                const userTasks = tasksRes.data.user_tasks;
                const filteredTasks = userTasks.filter(task => task.status !== 'complete');
                const sortedTasks = filteredTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                setTasks(sortedTasks.slice(0, 5)); // Show top 5 upcoming tasks
                
                // Fetch teams
                const teamsRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, { withCredentials: true });
                const userTeams = teamsRes.data;
                const sortedTeams = userTeams.sort((a, b) => {
                    const roleOrder = { owner: 1, admin: 2, member: 3 };
                    return roleOrder[a.role] - roleOrder[b.role];
                });
                setTeams(sortedTeams.slice(0, 3)); // Show top 3 teams
                
                // Fetch documents
                const docsRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/documents/`, { withCredentials: true });
                const sortedDocs = docsRes.data.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at);
                    const dateB = new Date(b.updated_at || b.created_at);
                    return dateB - dateA;
                });
                setDocuments(sortedDocs.slice(0, 3)); // Show 3 most recent documents
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    const handleTeamClick = (teamId) => {
        navigate(`/team/${teamId}`);
    };

    return (
        <div>
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    <div className="recent-items-card">
                        {/* Recent Documents */}
                        <div className="row mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3>Recent Documents</h3>
                            </div>
                            <DocumentGrid 
                                documents={documents}
                                emptyMessage="No documents available"
                                limit={6}
                                showTeamName={true}
                            />
                        </div>
    
                        {/* Tasks */}
                        <div className="row mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3>Upcoming Tasks</h3>
                            </div>
                            <TaskTable 
                                tasks={tasks} 
                                emptyMessage="No upcoming tasks" 
                                limit={6}
                                showColumns={{ status: true, description: true, assignedTo: true, team: true, dueDate: true, actions: false }}
                            />
                        </div>

                        {/* Teams */}
                        <div className="row mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h3>Your Teams</h3>
                            </div>
                            <TeamGrid 
                                teams={teams} 
                                emptyMessage="No teams available"
                                limit={3}
                                showActions={false}
                                currentUser={user}
                                onTeamClick={handleTeamClick}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    firstLogin: state.auth.firstLogin,
    user: state.auth.user,
});

export default connect(mapStateToProps, { resetFirstLogin })(Dashboard);