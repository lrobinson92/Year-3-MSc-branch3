import React from 'react';
import { Link } from 'react-router-dom';
import bannerImage from '../assests/images/home.jpeg';
import cardPreview from '../assests/images/card-preview.jpg';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';

const Home = ( { isAuthenticated } ) => {


    if (isAuthenticated) {
        return <Navigate to="view/dashboard/" />;
    }

    return (
        <div className="home-page">     
            <div className="image-container">
                <img
                    src={bannerImage}
                    alt="Top Banner"
                    className="slanted-image"
                />
            </div>

            <div className='container'>
                {/* Card Layout */}
                <div className="row mt-5 d-flex align-items-stretch">
                    <div className="col-md-6 d-flex">
                        <div className="card p-4 shadow-lg flex-fill">
                            <h1 className="display-4">SOP Generator</h1>
                            <p className="lead">
                                Streamline your workflow with our easy-to-use SOP Generator.
                                Whether you are a small business or a large enterprise, crafting
                                clear and concise procedures has never been simpler!
                            </p>
                            <hr className="my-4" />
                            <Link to="/login" className="btn btn-primary col-md-3">
                                Get Started
                            </Link>
                        </div>
                    </div>
                    <div className="col-md-6 d-flex">
                        <div className="card p-4 shadow-lg flex-fill">
                            <img
                                src={cardPreview}
                                alt="Supporting Visual"
                                className="img-fluid rounded"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps)(Home);
