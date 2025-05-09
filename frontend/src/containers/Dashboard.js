import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import DocumentGrid from '../components/DocumentGrid';
import { resetFirstLogin } from '../actions/auth';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';
import { FaFileAlt, FaTasks, FaUsers, FaPlus, FaBell, FaClock } from 'react-icons/fa';
import { formatDate } from '../utils/utils';

const Dashboard = ({ isAuthenticated, firstLogin, resetFirstLogin, user }) => {
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSOPs: 0,
        activeTasks: 0,
        teamCount: 0,
        sopsForReview: 0,
        tasksDueSoon: 0
    });
    const navigate = useNavigate();
    
    // Define brand colors for consistency
    const brandPurple = '#111049';
    const brandLightPurple = '#615fd8';

    // Add these helper functions near the top of your Dashboard component
    const isPastDue = (dueDate) => {
        if (!dueDate) return false;
        const now = new Date();
        const due = new Date(dueDate);
        return due < now;
    };

    const isComingSoon = (dueDate) => {
        if (!dueDate) return false;
        const due = new Date(dueDate);
        const now = new Date();
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
    };

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
                setTasks(sortedTasks.slice(0, 6)); // Show top 6 upcoming tasks
                
                // Update active tasks stat
                setStats(prev => ({...prev, activeTasks: filteredTasks.length}));
                
                // Calculate tasks due in next 7 days
                const now = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(now.getDate() + 7);
                
                const tasksDueSoon = filteredTasks.filter(task => {
                    const dueDate = new Date(task.due_date);
                    return dueDate >= now && dueDate <= nextWeek;
                }).length;
                
                setStats(prev => ({...prev, tasksDueSoon}));
                
                // Fetch documents
                const docsRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/documents/`, { withCredentials: true });
                const sortedDocs = docsRes.data.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at);
                    const dateB = new Date(b.updated_at || b.created_at);
                    return dateB - dateA;
                });
                setDocuments(sortedDocs.slice(0, 6)); // Show 6 most recent documents
                
                // Update total SOPs stat
                setStats(prev => ({...prev, totalSOPs: docsRes.data.length}));
                
                // Calculate SOPs due for review in next 14 days
                const twoWeeksLater = new Date();
                twoWeeksLater.setDate(now.getDate() + 14);
                
                const sopsForReview = docsRes.data.filter(doc => {
                    if (!doc.review_date) return false;
                    
                    const reviewDate = new Date(doc.review_date);
                    return reviewDate >= now && reviewDate <= twoWeeksLater;
                }).length;
                
                setStats(prev => ({...prev, sopsForReview}));
                
                // Fetch teams to get the count
                const teamsRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, { withCredentials: true });
                
                // Update team count stat - count the number of teams the user is in
                if (teamsRes.data && Array.isArray(teamsRes.data)) {
                    setStats(prev => ({...prev, teamCount: teamsRes.data.length}));
                }
                
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
                            {/* Total SOPs */}
                            <div className="col-md-4 col-lg">
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
                            
                            {/* Active Tasks */}
                            <div className="col-md-4 col-lg">
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
                            
                            {/* Teams */}
                            <div className="col-md-4 col-lg">
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
                            
                            {/* SOPs Due for Review */}
                            <div className="col-md-6 col-lg">
                                <Link to="/view/documents" className="text-decoration-none">
                                    <div className="card border-0 shadow-sm h-100 transition-hover">
                                        <div className="card-body d-flex align-items-center">
                                            <div className="rounded-circle d-flex justify-content-center align-items-center me-3" 
                                                style={{ width: '48px', height: '48px', backgroundColor: 'rgba(97, 95, 216, 0.15)' }}>
                                                <FaBell style={{ color: brandPurple }} size={22} />
                                            </div>
                                            <div>
                                                <h6 className="text-muted mb-1">SOPs Due Review</h6>
                                                <h4 className="mb-0 text-dark">{stats.sopsForReview}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                            
                            {/* Tasks Due Soon */}
                            <div className="col-md-6 col-lg">
                                <Link to="/view/tasks" className="text-decoration-none">
                                    <div className="card border-0 shadow-sm h-100 transition-hover">
                                        <div className="card-body d-flex align-items-center">
                                            <div className="rounded-circle d-flex justify-content-center align-items-center me-3" 
                                                style={{ width: '48px', height: '48px', backgroundColor: 'rgba(97, 95, 216, 0.15)' }}>
                                                <FaClock style={{ color: brandPurple }} size={22} />
                                            </div>
                                            <div>
                                                <h6 className="text-muted mb-1">Tasks Due Soon</h6>
                                                <h4 className="mb-0 text-dark">{stats.tasksDueSoon}</h4>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                        
                        {/* Featured Content Cards - 60/40 split that aligns with stats cards */}
                        <div className="row g-4">
                            {/* Reviews Card - Wider (60%) */}
                            <div className="col-lg-7">
                                {/* Featured Documents Card */}
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
                                                                        Review: {formatDate(doc.review_date)}
                                                                    </div>
                                                                ) : (
                                                                    <div className="small text-muted">
                                                                        No review scheduled
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="align-middle">
                                                                <div className="small text-muted">
                                                                    {formatDate(doc.updated_at || doc.created_at)}
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
                            
                            {/* Tasks Card - Narrower (40%) */}
                            <div className="col-lg-5">
                                {/* Upcoming Tasks Card */}
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
                                                                <span className="d-flex align-items-center">
                                                                    Due: {formatDate(task.due_date)}
                                                                    {isPastDue(task.due_date) && task.status !== 'complete' ? (
                                                                        <span className="badge bg-danger ms-2 text-white" style={{ fontSize: '0.65rem' }}>Overdue</span>
                                                                    ) : (
                                                                        isComingSoon(task.due_date) && task.status !== 'complete' && (
                                                                            <span className="badge bg-warning ms-2 text-dark" style={{ fontSize: '0.65rem' }}>Due soon</span>
                                                                        )
                                                                    )}
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