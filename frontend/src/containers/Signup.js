import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { signup } from '../actions/auth';

const Signup = ({ signup, isAuthenticated }) => {

    const [accountCreated, setAccountCreated] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        re_password: ''
    });

    const { name, email, password, re_password } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
    
        if (password === re_password) {
            try {
                const result = await signup(name, email, password, re_password);
                if (result === "success") {
                    alert("Account created! Please check your email to verify your account.");
                    setAccountCreated(true);
                }
            } catch (error) {
                alert(error); // Display the error message (e.g., "Email already in use.")
            }
        } else {
            alert("Passwords do not match!");
        }
    };

    if (isAuthenticated) {
        return <Navigate to='/' />
    }

    if (accountCreated) {
        return <Navigate to='/login' />
    }

    return (
        <div className='container mt-5 entry-container'>
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <h1 className="text-center mb-4" >Sign Up</h1>
                <form onSubmit={onSubmit}>
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
                <button className="btn btn-primary w-100" type='submit'>Sign Up</button>
                </form>
                <p className='mt-4 text-center'>
                    Already have an account? <Link to='/login'>Login</Link>
                </p>
            </div>
        </div>
    )
};

const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { signup })(Signup);