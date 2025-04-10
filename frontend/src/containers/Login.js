import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { login } from '../actions/auth';

const Login = ({ login, isAuthenticated, error }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const { email, password } = formData;
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = e => {
        e.preventDefault();
        login(email, password);
    };



    // Update the auth redirect to respect Google Drive auth:
    useEffect(() => {
        if (isAuthenticated) {
            // Get the current URL search params
            const searchParams = new URLSearchParams(window.location.search);
            
            // If we're coming from a Google Drive auth callback, don't redirect to dashboard
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
                <h1 className="text-center mb-4" >Sign in to SOPify</h1>
                {error && <div className="alert alert-danger" role="alert">{error}</div>}
                <form onSubmit={onSubmit}>
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
                    <button className="btn btn-primary w-100" type="submit">Login</button>
                </form>
                <p className="mt-4 text-center">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
                <p className="text-center">
                    Forgot your password? <Link to="/reset-password">Reset Password</Link>
                </p>
            </div>
        </div>
    );
    
};

const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated,
    error: state.auth.error
});

export default connect(mapStateToProps, { login })(Login);