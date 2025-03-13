import React, { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { logout } from '../actions/auth';
import logo from '../assests/images/logo.png';

const Navbar = ({ logout, isAuthenticated }) => {
    const navigate = useNavigate(); // React Router hook for navigation

    const handleLogout = () => {
        logout(); // Dispatch logout action
        navigate('/'); // Redirect to the homepage
    };

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
                <Link to="/" className="navbar-brand d-flex align-items-center">
                    <img src={logo} alt="Logo" style={{ height: '40px', marginRight: '10px' }} />
                    SOPify
                </Link>
                <div className="collapse navbar-collapse">
                    {isAuthenticated ? authLinks() : guestLinks()}
                </div>
            </div>
        </nav>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated, // Correctly map the isAuthenticated state
});

export default connect(mapStateToProps, { logout })(Navbar);
