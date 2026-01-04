import React from 'react';

const LandingPage = ({ onStart }) => {
  return (
    <section className="hero-wrap d-flex align-items-center justify-content-center text-center min-vh-100">
      <div className="glass-card p-5 animate-up">
        <h1 className="display-4 fw-bold text-navy mb-3">Your Partner in Need</h1>
        <p className="lead text-dark mb-4">
          A complete digital health ecosystem for Patients, Doctors, and Admins.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-lg btn-teal px-5 rounded-pill shadow" onClick={onStart}>
            Get Started
          </button>
        </div>
      </div>
    </section>
  );
};

export default LandingPage;