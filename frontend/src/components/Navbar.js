import React, { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { logout } from '../actions/auth';
import logo from '../assests/images/logo.png';

/**
 * Navbar Component
 * 
 * Responsive navigation bar that displays different links based on authentication state.
 * Connected to Redux for authentication status and logout functionality.
 * 
 * @param {Function} logout - Redux action to log out the user
 * @param {boolean} isAuthenticated - Whether user is currently logged in
 */
const Navbar = ({ logout, isAuthenticated }) => {
    // React Router hook for navigation after actions
    const navigate = useNavigate();

    /**
     * Handle user logout
     * Dispatches logout action and redirects to homepage
     */
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    /**
     * Navigation links for guests (not logged in)
     * Shows sign in and registration options
     * 
     * @returns {JSX.Element} Guest navigation links
     */
    const guestLinks = () => (
        <Fragment>
            <div className="d-flex ms-auto flex-wrap">
                <Link to="/login" className="btn btn-outline-primary me-2 mb-2 mb-lg-0">
                    Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary mb-2 mb-lg-0">
                    Get Started
                </Link>
            </div>
        </Fragment>
    );

    /**
     * Navigation links for authenticated users
     * Shows logout button and access to app features
     * 
     * @returns {JSX.Element} Authenticated user navigation links
     */
    const authLinks = () => (
        <div className="d-flex ms-auto flex-wrap">
            <button
                className="btn btn-outline-primary me-2 mb-2 mb-lg-0"
                onClick={handleLogout}
            >
                Logout
            </button>
        </div>
    );

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                {/* Logo and brand name */}
                <Link to="/" className="navbar-brand d-flex align-items-center">
                    <img src={logo} alt="Logo" style={{ height: '40px', marginRight: '10px' }} />
                    SOPify
                </Link>
                
                {/* Responsive navbar content */}
                <div className="collapse navbar-collapse">
                    {/* Conditional rendering based on authentication status */}
                    {isAuthenticated ? authLinks() : guestLinks()}
                </div>
            </div>
        </nav>
    );
};

/**
 * Map Redux state to component props
 * 
 * @param {Object} state - Redux state
 * @returns {Object} Props derived from Redux state
 */
const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
});

// Connect component to Redux store
export default connect(mapStateToProps, { logout })(Navbar);
