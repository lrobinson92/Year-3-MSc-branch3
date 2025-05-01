import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { login } from '../actions/auth';

/**
 * Login Component
 * 
 * Handles user authentication by providing a login form.
 * Validates credentials and redirects authenticated users to the dashboard
 * or to their requested destination after Google Drive authentication.
 */
const Login = ({ login, isAuthenticated, error }) => {
    // State to manage form input values
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Destructure form data for easier access
    const { email, password } = formData;
    
    // Navigation hook for redirections
    const navigate = useNavigate();

    /**
     * Update form state when input values change
     * Uses computed property name to update the specific field
     */
    const onChange = e => setFormData({ 
        ...formData, 
        [e.target.name]: e.target.value 
    });

    /**
     * Handle form submission
     * Prevents default form behavior and dispatches login action
     */
    const onSubmit = e => {
        e.preventDefault();
        login(email, password);
    };

    /**
     * Redirect authenticated users based on context
     * Handles special case for Google Drive authentication callbacks
     */
    useEffect(() => {
        if (isAuthenticated) {
            // Get the current URL search params
            const searchParams = new URLSearchParams(window.location.search);
            
            // If we're coming from a Google Drive auth callback, redirect to specified destination
            if (searchParams.get('drive_auth') === 'success') {
                // Extract the intended destination if available
                const destination = searchParams.get('destination') || '/view/documents';
                navigate(destination + '?drive_auth=success');
            } else {
                // Normal login flow - redirect to dashboard
                navigate('/view/dashboard');
            }
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="container mt-5 entry-container">
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                {/* Form header */}
                <h1 className="text-center mb-4">Sign in to SOPify</h1>
                
                {/* Error alert - only shown when there's an error */}
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                
                {/* Login form */}
                <form onSubmit={onSubmit}>
                    {/* Email input field */}
                    <div className="form-group mb-4">
                        <input
                            className="form-control"
                            type="email"
                            placeholder="Email"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>
                    
                    {/* Password input field */}
                    <div className="form-group mb-4">
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            minLength="8"
                            required
                        />
                    </div>
                    
                    {/* Submit button */}
                    <button className="btn btn-primary w-100" type="submit">Login</button>
                </form>
                
                {/* Registration link */}
                <p className="mt-4 text-center">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
                
                {/* Password reset link */}
                <p className="text-center">
                    Forgot your password? <Link to="/reset-password">Reset Password</Link>
                </p>
            </div>
        </div>
    );
};

/**
 * Maps Redux state to component props
 * Provides authentication status and error messages
 */
const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated,
    error: state.auth.error
});

/**
 * Connect component to Redux store
 */
export default connect(mapStateToProps, { login })(Login);