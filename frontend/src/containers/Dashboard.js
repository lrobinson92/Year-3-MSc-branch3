import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import DocumentGrid from '../components/DocumentGrid';
import { resetFirstLogin } from '../actions/auth';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';
import { FaFileAlt, FaTasks, FaUsers, FaPlus } from 'react-icons/fa';

const Dashboard = ({ isAuthenticated, firstLogin, resetFirstLogin, user }) => {
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSOPs: 0,
        activeTasks: 0,
        teamCount: 0
    });
    const navigate = useNavigate();
    
    // Define brand colors for consistency
    const brandPurple = '#111049';
    const brandLightPurple = '#615fd8';

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
                
                // Update active tasks stat
                setStats(prev => ({...prev, activeTasks: filteredTasks.length}));
                
                // Fetch documents
                const docsRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/documents/`, { withCredentials: true });
                const sortedDocs = docsRes.data.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at);
                    const dateB = new Date(b.updated_at || b.created_at);
                    return dateB - dateA;
                });
                setDocuments(sortedDocs.slice(0, 3)); // Show 3 most recent documents
                
                // Update total SOPs stat
                setStats(prev => ({...prev, totalSOPs: docsRes.data.length}));
                
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

    return (
        <div>
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    {/* Dashboard Header with Gradient Background */}
                    <div className="py-3 mb-4">
                        <div className="container-fluid px-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 className="h3 text-white mb-0">Dashboard</h1>
                                    <p className="text-white-50 mb-0">Welcome back, {user?.name || 'User'}</p>
                                </div>
                                <div className="d-flex gap-2">

                                    <Link to="/create-document" className="btn btn-light btn-sm d-flex align-items-center">
                                        <FaPlus className="me-1" /> New SOP
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="container-fluid px-4">
                        {/* Stats Cards in a Single Row */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <Link to="/view/documents" className="text-decoration-none">
                                    <div className="card border-0 shadow-sm h-100 transition-hover">
                                        <div className="card-body d-flex align-items-center">
                                            <div className="rounded-circle d-flex justify-content-center align-items-center me-3" 
                                                style={{ width: '48px', height: '48px', backgroundColor: 'rgba(97, 95, 216, 0.15)' }}>
                                                <FaFileAlt style={{ color: brandPurple }} size={22} />
                                            </div>
                                            <div>
                                                <h6 className="text-muted mb-1">Total SOPs</h6>
                                                <h4 className="mb-0 text-dark">{stats.totalSOPs}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            <div className="col-md-4">
                                <Link to="/view/tasks" className="text-decoration-none">
                                    <div className="card border-0 shadow-sm h-100 transition-hover">
                                        <div className="card-body d-flex align-items-center">
                                            <div className="rounded-circle d-flex justify-content-center align-items-center me-3" 
                                                style={{ width: '48px', height: '48px', backgroundColor: 'rgba(97, 95, 216, 0.15)' }}>
                                                <FaTasks style={{ color: brandPurple }} size={22} />
                                            </div>
                                            <div>
                                                <h6 className="text-muted mb-1">Active Tasks</h6>
                                                <h4 className="mb-0 text-dark">{stats.activeTasks}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            <div className="col-md-4">
                                <Link to="/view/teams" className="text-decoration-none">
                                    <div className="card border-0 shadow-sm h-100 transition-hover">
                                        <div className="card-body d-flex align-items-center">
                                            <div className="rounded-circle d-flex justify-content-center align-items-center me-3" 
                                                style={{ width: '48px', height: '48px', backgroundColor: 'rgba(97, 95, 216, 0.15)' }}>
                                                <FaUsers style={{ color: brandPurple }} size={22} />
                                            </div>
                                            <div>
                                                <h6 className="text-muted mb-1">My Teams</h6>
                                                <h4 className="mb-0 text-dark">{stats.teamCount}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                        
                        {/* Featured Content Cards - 2-column layout with improved styling */}
                        <div className="row g-4">
                            {/* Featured Documents Card - Left Column */}
                            <div className="col-lg-7">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                                        <h5 className="mb-0 d-flex align-items-center">
                                            <FaFileAlt className="me-2 text-muted" />
                                            Recent & Upcoming Reviews
                                        </h5>
                                        <Link to="/view/documents" className="btn btn-sm" 
                                            style={{ 
                                                color: 'white',
                                                backgroundColor: brandPurple,
                                                padding: '0.25rem 0.75rem'
                                            }}>
                                            View All
                                        </Link>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Document</th>
                                                        <th>Team</th>
                                                        <th>Status</th>
                                                        <th>Last Updated</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {documents.map(doc => (
                                                        <tr key={doc.id} 
                                                            onClick={() => navigate(`/view/sop/${doc.id}`)}
                                                            style={{ cursor: 'pointer' }}
                                                            className="transition-hover">
                                                            <td className="align-middle">
                                                                <div className="d-flex align-items-center">
                                                                    <FaFileAlt className="me-2 text-muted" />
                                                                    <div>
                                                                        {doc.title}
                                                                        {doc.review_date && doc.days_until_review <= 14 && (
                                                                            <div className="small">
                                                                                {doc.days_until_review <= 0 ? (
                                                                                    <span className="badge bg-danger">Review Overdue</span>
                                                                                ) : (
                                                                                    <span className="badge bg-warning text-dark">Review Soon</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="align-middle">{doc.team_name || "Personal"}</td>
                                                            <td className="align-middle">
                                                                {doc.review_date ? (
                                                                    <div className="small text-muted">
                                                                        Review: {new Date(doc.review_date).toLocaleDateString()}
                                                                    </div>
                                                                ) : (
                                                                    <div className="small text-muted">
                                                                        No review scheduled
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="align-middle">
                                                                <div className="small text-muted">
                                                                    {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {documents.length === 0 && (
                                                        <tr>
                                                            <td colSpan="4" className="text-center py-3 text-muted">
                                                                No documents available
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="card-footer bg-white py-3 text-center">
                                        <Link to="/create-document" className="btn btn-sm btn-outline-primary" 
                                            style={{ 
                                                color: brandPurple,
                                                borderColor: brandPurple,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                            }}>
                                            <FaPlus /> Create New SOP
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Upcoming Tasks Card - Right Column */}
                            <div className="col-lg-5">
                                <div className="card border-0 shadow-sm h-100">
                                    <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                                        <h5 className="mb-0 d-flex align-items-center">
                                            <FaTasks className="me-2 text-muted" />
                                            Tasks Due Soon
                                        </h5>
                                        <Link to="/view/tasks" className="btn btn-sm" 
                                            style={{ 
                                                color: 'white',
                                                backgroundColor: brandPurple,
                                                padding: '0.25rem 0.75rem'
                                            }}>
                                            View All
                                        </Link>
                                    </div>
                                    <div className="card-body p-0">
                                        {tasks.length > 0 ? (
                                            <ul className="list-group list-group-flush">
                                                {tasks.map(task => (
                                                    <li key={task.id} 
                                                        className="list-group-item px-3 py-3 border-bottom transition-hover"
                                                        onClick={() => navigate(`/task/${task.id}`)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <h6 className="mb-0">{task.title}</h6>
                                                            <span className={`badge ${
                                                                task.priority === 'high' ? 'bg-danger' : 
                                                                task.priority === 'medium' ? 'bg-warning text-dark' : 
                                                                'bg-info text-dark'
                                                            }`}>
                                                                {task.priority}
                                                            </span>
                                                        </div>
                                                        <div className="text-muted small">
                                                            <div className="mb-1">
                                                                {task.description?.length > 60 
                                                                    ? task.description.substring(0, 60) + '...' 
                                                                    : task.description}
                                                            </div>
                                                            <div className="d-flex justify-content-between">
                                                                <span>
                                                                    {task.team_name ? `Team: ${task.team_name}` : "Personal"}
                                                                </span>
                                                                <span>
                                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="text-center py-4 text-muted">
                                                <div className="my-4">
                                                    <FaTasks style={{ fontSize: '2rem', opacity: 0.3 }} />
                                                    <p className="mt-2">No upcoming tasks</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-footer bg-white py-3 text-center">
                                        <Link to="/create-task" className="btn btn-sm btn-outline-primary"
                                            style={{ 
                                                color: brandPurple,
                                                borderColor: brandPurple,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                            }}>
                                            <FaPlus /> Create New Task
                                        </Link>
                                    </div>
                                </div>
                            </div>
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