import React from 'react';
import { Link } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { FaFileAlt, FaUsers, FaCheckSquare, FaGoogle, FaRocket, FaLightbulb } from 'react-icons/fa';
import bannerImage from '../assests/images/night-sky.jpg';
import cardPreview from '../assests/images/dashboard.png';

/**
 * Home Component
 * 
 * Landing page for unauthenticated users with marketing content and value proposition.
 * Includes sections for hero banner, features, workflow steps, benefits, and call-to-action.
 * Automatically redirects authenticated users to the dashboard.
 */
const Home = ({ isAuthenticated }) => {
    // Brand color definitions for consistent styling
    const brandPurple = '#111049'; 
    const brandLightPurple = '#615fd8';

    // Redirect authenticated users to dashboard
    if (isAuthenticated) {
        return <Navigate to="view/dashboard/" />;
    }

    return (
        <div className="home-page">
            {/* Hero Section - Main banner with call-to-action buttons */}
            <div className="hero-section position-relative">
                <img
                    src={bannerImage}
                    alt="SOPify Banner"
                    className="w-100"
                    style={{ height: '55vh', objectFit: 'cover' }}
                />
                <div className="position-absolute top-0 start-0 w-100 h-100" 
                    style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 10%'
                    }}>
                    <div>
                        <h1 className="display-2 fw-bold mb-4" style={{ color: '#ffffff' }}>SOPify</h1>
                        <p className="lead fs-3 mb-4" style={{ color: '#ffffff' }}>
                            Create, manage, and collaborate on Standard Operating Procedures with ease
                        </p>
                        <div className="d-flex gap-3">
                            <Link to="/signup" className="btn btn-outline-light btn-lg px-4 fw-semibold">
                                Get Started for Free
                            </Link>
                            <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className='container py-5'>
                {/* Value Proposition - Core message about product benefits */}
                <div className="text-center mb-5">
                    <h2 className="display-5 fw-bold mb-3">Streamline Your Business Procedures</h2>
                    <p className="lead fs-4 text-muted mx-auto" style={{ maxWidth: '800px' }}>
                        SOPify helps teams create, organize, and follow standard operating procedures,
                        reducing errors and increasing productivity.
                    </p>
                </div>

                {/* Feature Cards - Core product capabilities */}
                <div className="row g-4 mb-5">
                    {/* Document Management Feature */}
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0">
                            <div className="card-body p-4">
                                <div className="feature-icon d-flex align-items-center justify-content-center mb-3">
                                    <FaFileAlt style={{ color: brandPurple }} size={24} />
                                </div>
                                <h3 className="card-title h5 fw-bold text-center">Document Management</h3>
                                <p className="card-text text-center">
                                    Create, edit and store your SOPs securely in Google Drive with real-time collaboration.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Team Collaboration Feature */}
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0">
                            <div className="card-body p-4">
                                <div className="feature-icon d-flex align-items-center justify-content-center mb-3">
                                    <FaUsers style={{ color: brandPurple }} size={24} />
                                </div>
                                <h3 className="card-title h5 fw-bold text-center">Team Collaboration</h3>
                                <p className="card-text text-center">
                                    Create teams, assign tasks, and manage permissions for seamless workflow.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI-Powered Generation Feature */}
                    <div className="col-md-4">
                        <div className="card h-100 shadow-sm border-0">
                            <div className="card-body p-4">
                                <div className="feature-icon d-flex align-items-center justify-content-center mb-3">
                                    <FaRocket style={{ color: brandPurple }} size={24} />
                                </div>
                                <h3 className="card-title h5 fw-bold text-center">AI-Powered Generation</h3>
                                <p className="card-text text-center">
                                    Generate professional SOPs instantly with our AI assistant, saving hours of writing time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How It Works - Step-by-step workflow explanation */}
                <div className="py-5">
                    <h2 className="display-6 fw-bold text-center mb-5">How SOPify Works</h2>
                    <div className="row g-4">
                        {/* Step 1: Create Team */}
                        <div className="col-md-3">
                            <div className="steps text-center">
                                <div className="step-number text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                    style={{ 
                                        width: '60px', 
                                        height: '60px',
                                        backgroundColor: brandPurple,
                                        boxShadow: '0 4px 6px rgba(17, 16, 73, 0.3)'
                                    }}>
                                    <span className="fw-bold fs-5">1</span>
                                </div>
                                <h4 className="h5 fw-bold">Create Team</h4>
                                <p className="text-muted">Invite members and organize your departments</p>
                            </div>
                        </div>

                        {/* Step 2: Connect Drive */}
                        <div className="col-md-3">
                            <div className="steps text-center">
                                <div className="step-number text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                    style={{ 
                                        width: '60px', 
                                        height: '60px',
                                        backgroundColor: brandPurple,
                                        boxShadow: '0 4px 6px rgba(17, 16, 73, 0.3)'
                                    }}>
                                    <span className="fw-bold fs-5">2</span>
                                </div>
                                <h4 className="h5 fw-bold">Connect Drive</h4>
                                <p className="text-muted">Link your Google Drive for secure document storage</p>
                            </div>
                        </div>

                        {/* Step 3: Create SOPs */}
                        <div className="col-md-3">
                            <div className="steps text-center">
                                <div className="step-number text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                    style={{ 
                                        width: '60px', 
                                        height: '60px',
                                        backgroundColor: brandPurple,
                                        boxShadow: '0 4px 6px rgba(17, 16, 73, 0.3)'
                                    }}>
                                    <span className="fw-bold fs-5">3</span>
                                </div>
                                <h4 className="h5 fw-bold">Create SOPs</h4>
                                <p className="text-muted">Write or generate professional SOPs</p>
                            </div>
                        </div>

                        {/* Step 4: Track Tasks */}
                        <div className="col-md-3">
                            <div className="steps text-center">
                                <div className="step-number text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" 
                                    style={{ 
                                        width: '60px', 
                                        height: '60px',
                                        backgroundColor: brandPurple,
                                        boxShadow: '0 4px 6px rgba(17, 16, 73, 0.3)'
                                    }}>
                                    <span className="fw-bold fs-5">4</span>
                                </div>
                                <h4 className="h5 fw-bold">Track Tasks</h4>
                                <p className="text-muted">Manage implementation with task assignments</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Application Preview - Dashboard showcase with feature list */}
                <div className="row align-items-center py-5">
                    <div className="col-lg-5 mb-4 mb-lg-0">
                        <h2 className="display-6 fw-bold mb-3">Powerful, Yet Simple To Use</h2>
                        <p className="lead">
                            SOPify provides an intuitive dashboard where you can:
                        </p>
                        <ul className="list-unstyled">
                            <li className="mb-3 d-flex align-items-center">
                                <FaCheckSquare style={{ color: brandPurple, fontSize: '22px' }} className="me-2" />
                                <span className="text-dark fs-5">Access all your documents in one place</span>
                            </li>
                            <li className="mb-3 d-flex align-items-center">
                                <FaCheckSquare style={{ color: brandPurple, fontSize: '22px' }} className="me-2" />
                                <span className="text-dark fs-5">Track pending tasks and deadlines</span>
                            </li>
                            <li className="mb-3 d-flex align-items-center">
                                <FaCheckSquare style={{ color: brandPurple, fontSize: '22px' }} className="me-2" />
                                <span className="text-dark fs-5">Collaborate with team members</span>
                            </li>
                            <li className="mb-3 d-flex align-items-center">
                                <FaCheckSquare style={{ color: brandPurple, fontSize: '22px' }} className="me-2" />
                                <span className="text-dark fs-5">Generate new SOPs with AI assistance</span>
                            </li>
                        </ul>
                        <Link to="/signup" className="btn mt-3 text-white" style={{ backgroundColor: brandPurple, padding: '10px 24px', fontSize: '18px' }}>
                            Get Started Now
                        </Link>
                    </div>
                    <div className="col-lg-7">
                        <div className="card shadow border-0">
                            <img
                                src={cardPreview}
                                alt="SOPify Dashboard Preview"
                                className="img-fluid rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* Benefits Section - Key value propositions */}
                <div className="py-5">
                    <h2 className="display-6 fw-bold text-center mb-5">Why Teams Love SOPify</h2>
                    <div className="row g-4">
                        {/* Consistency Benefit */}
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center justify-content-center mb-3">
                                        <FaLightbulb className="text-warning" size={32} />
                                    </div>
                                    <h4 className="card-title h5 fw-bold text-center">Improve Consistency</h4>
                                    <p className="card-text text-center">
                                        Ensure all team members follow the same procedures, reducing errors and improving quality.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Time-saving Benefit */}
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center justify-content-center mb-3">
                                        <FaRocket className="text-success" size={32} />
                                    </div>
                                    <h4 className="card-title h5 fw-bold text-center">Save Time</h4>
                                    <p className="card-text text-center">
                                        Generate professional SOPs in minutes with AI assistance, not hours of manual writing.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Integration Benefit */}
                        <div className="col-md-4">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-body p-4">
                                    <div className="d-flex align-items-center justify-content-center mb-3">
                                        <FaGoogle className="text-danger" size={32} />
                                    </div>
                                    <h4 className="card-title h5 fw-bold text-center">Seamless Integration</h4>
                                    <p className="card-text text-center">
                                        Works with the tools you already use, like Google Drive for document management.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Call to Action - Final conversion section */}
                <div className="p-5 text-center rounded-3 mt-5"
                    style={{
                        background: `linear-gradient(175deg, ${brandPurple} 0%, ${brandLightPurple} 100%)`,
                        boxShadow: '0 5px 15px rgba(17, 16, 73, 0.3)'
                    }}>
                    <h2 className="display-5 fw-bold mb-3" style={{ color: '#ffffff' }}>Ready to Streamline Your Procedures?</h2>
                    <p className="fs-4 mb-4" style={{ color: '#ffffff' }}>
                        Join thousands of teams using SOPify to create better standard operating procedures.
                    </p>
                    <Link to="/signup" className="btn btn-light btn-lg px-5 py-3 fw-bold">
                        Start Your Free Account
                    </Link>
                </div>
            </div>
        </div>
    );
};

/**
 * Maps Redux state to component props
 * Used to determine if user is already authenticated
 */
const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated
});

/**
 * Connect component to Redux store
 */
export default connect(mapStateToProps)(Home);
