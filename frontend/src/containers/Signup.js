import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { signup } from '../actions/auth';

/**
 * Signup Component
 * 
 * Handles user registration by providing a signup form.
 * Collects user information, validates password matching,
 * and sends registration data to the backend.
 * Redirects to login page after successful account creation.
 */
const Signup = ({ signup, isAuthenticated }) => {
    // State to track if account has been created successfully
    const [accountCreated, setAccountCreated] = useState(false);
    
    // State to manage form input values
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        re_password: ''
    });

    // Destructure form data for easier access
    const { name, email, password, re_password } = formData;

    /**
     * Update form state when input values change
     * Uses computed property name to update the specific field
     */
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    /**
     * Handle form submission
     * Validates matching passwords and dispatches signup action
     */
    const onSubmit = async (e) => {
        e.preventDefault();
    
        // Check if passwords match before submitting
        if (password === re_password) {
            try {
                // Attempt to create account using Redux action
                const result = await signup(name, email, password, re_password);
                if (result === "success") {
                    alert("Account created! Please check your email to verify your account.");
                    setAccountCreated(true);
                }
            } catch (error) {
                alert(error); // Display error message from backend
            }
        } else {
            alert("Passwords do not match!");
        }
    };

    // Redirect authenticated users to home page
    if (isAuthenticated) {
        return <Navigate to='/' />
    }

    // Redirect to login page after successful account creation
    if (accountCreated) {
        return <Navigate to='/login' />
    }

    return (
        <div className='container mt-5 entry-container'>
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                {/* Form header */}
                <h1 className="text-center mb-4">Sign Up</h1>
                
                {/* Registration form */}
                <form onSubmit={onSubmit}>
                    {/* Name input field */}
                    <div className="form-group mb-4">
                        <input
                            className='form-control'
                            type='text'
                            placeholder='Name*'
                            name='name'
                            autoComplete='name'
                            value={name}
                            onChange={onChange}
                            required
                        />
                    </div>
                    
                    {/* Email input field */}
                    <div className='form-group mb-4'>
                        <input
                            className='form-control'
                            type='email'
                            placeholder='Email*'
                            name='email'
                            autoComplete='email'
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>
                    
                    {/* Password input field */}
                    <div className='form-group mb-4'>
                        <input
                            className='form-control'
                            type='password'
                            placeholder='Password*'
                            name='password'
                            value={password}
                            onChange={onChange}
                            minLength='8'
                            required
                        />
                    </div>
                    
                    {/* Confirm password input field */}
                    <div className='form-group mb-4'>
                        <input
                            className='form-control'
                            type='password'
                            placeholder='Confirm Password*'
                            name='re_password'
                            value={re_password}
                            onChange={onChange}
                            minLength='8'
                            required
                        />
                    </div>
                    
                    {/* Submit button */}
                    <button className="btn btn-primary w-100" type='submit'>Sign Up</button>
                </form>
                
                {/* Login link */}
                <p className='mt-4 text-center'>
                    Already have an account? <Link to='/login'>Login</Link>
                </p>
            </div>
        </div>
    );
};

/**
 * Maps Redux state to component props
 * Provides authentication status to handle redirections
 */
const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated
});

/**
 * Connect component to Redux store
 */
export default connect(mapStateToProps, { signup })(Signup);