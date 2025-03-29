import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import DocumentGrid from '../components/DocumentGrid';
import axiosInstance from '../utils/axiosConfig';
import { formatDate, toTitleCase } from '../utils/utils';
import { fetchTeams } from '../actions/team';
import { FaPlus } from 'react-icons/fa'; // Import the plus icon

const TeamDetail = ({ isAuthenticated, user, fetchTeams }) => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                // Fetch teams for permission checks
                await fetchTeams();
                
                const teamRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/${teamId}/`, { withCredentials: true });
                setTeam(teamRes.data);

                // Debug logging
                console.log("Team data:", teamRes.data);
                console.log("Team members:", teamRes.data.members);

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
                console.error(err);
                setError('Failed to fetch team data');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [teamId, fetchTeams]);

    // Check if user is team owner
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

                    {/* Team Members with + button */}
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
                        
                        {/* Updated member display to use existing CSS classes */}
                        <ul className="member-list">
                            {team.members && team.members.map((member) => (
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

                    {/* Tasks with + button */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <h3>Tasks</h3>
                            <Link 
                                to={`/create-task?teamId=${teamId}`} 
                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                title="Add New Task"
                            >
                                <FaPlus className="me-1" /> Add Task
                            </Link>
                        </div>
                        <TaskTable 
                            tasks={tasks} 
                            emptyMessage="No tasks found for this team" 
                        />
                    </div>

                    {/* Documents with + button */}
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <h3>Documents</h3>
                            <Link 
                                to={`/create-document?teamId=${teamId}`} 
                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                title="Add New Document"
                            >
                                <FaPlus className="me-1" /> Add Document
                            </Link>
                        </div>
                        <DocumentGrid 
                            documents={documents}
                            emptyMessage="No documents found for this team"
                            showCreateButton={false} // We're showing our own button now
                            teamId={teamId}
                            showTeamName={false} // No need to show team name in team detail page
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user
});

export default connect(mapStateToProps, { fetchTeams })(TeamDetail);
