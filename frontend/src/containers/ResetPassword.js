import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { reset_password } from '../actions/auth';

const ResetPassword = ({ reset_password }) => {
    const [requestSent, setRequestSent] = useState(false);
    const [formData, setFormData] = useState({
        email: ''
    });

    const { email } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = e => {
        e.preventDefault();

        reset_password(email);
        setRequestSent(true);
    };

    if (requestSent) {
        return <Navigate to='/' />
    }

    return (
        <div className="container mt-5">
        <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
            <h1 className="text-center mb-4" >Request Password Reset</h1>
            <form onSubmit={onSubmit}>
            <div className='form-group'>
                    <input
                        className='form-control'
                        type='email'
                        placeholder='Email'
                        name='email'
                        autoComplete='email'
                        value={email}
                        onChange={onChange}
                        required
                    />
                </div>
                <button className="btn btn-primary mt-4 w-100" type="submit">Reset Password</button>
            </form>
        </div>
    </div>
    );
};



export default connect(null, { reset_password })(ResetPassword);