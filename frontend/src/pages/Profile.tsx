import React, { useState, useEffect } from 'react';
import userService from '../api/userService';
import { useAuth } from '../context/AuthContext';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await userService.getProfile();
        setFormData((prev) => ({
          ...prev,
          firstName: profile?.firstName || '',
          lastName: profile?.lastName || '',
          email: profile?.email || '',
          gender: profile?.gender || '',
        }));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await userService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender || undefined,
      });
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      await userService.updateProfile({
        password: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      // Clear password fields after successful update
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      
      setSuccess('Password updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdating(false);
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'other': return 'Other';
      default: return 'Prefer not to say';
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-3">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">User Profile</h5>
            </div>
            <div className="card-body text-center">
              <div className="mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex justify-content-center align-items-center" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                  {formData.firstName && formData.firstName.length > 0 
                    ? formData.firstName.charAt(0).toUpperCase() 
                    : '?'}
                </div>
              </div>
              <h5>{formData.firstName || '---'} {formData.lastName || '---'}</h5>
              <p className="text-muted">{formData.email || 'No email available'}</p>
            </div>
            <div className="list-group list-group-flush">
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('profile');
                  setIsEditing(false);
                }}
              >
                Profile Information
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => setActiveTab('password')}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
        
        <div className="col-md-9">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {activeTab === 'profile' ? (isEditing ? 'Edit Profile' : 'Profile Information') : 'Change Password'}
              </h5>
              {activeTab === 'profile' && !isEditing && (
                <button className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              
              {activeTab === 'profile' ? (
                isEditing ? (
                  <form onSubmit={handleProfileUpdate}>
                    <div className="mb-3">
                      <label htmlFor="firstName" className="form-label">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="lastName" className="form-label">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={formData.email}
                        disabled
                      />
                      <div className="form-text">Email cannot be changed</div>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="gender" className="form-label">
                        Gender
                      </label>
                      <select
                        className="form-select"
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="d-flex gap-2 mt-3">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={updating}
                      >
                        {updating ? 'Updating...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div className="row mb-3">
                      <div className="col-md-3 fw-bold">First Name:</div>
                      <div className="col-md-9">{formData.firstName || '---'}</div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-3 fw-bold">Last Name:</div>
                      <div className="col-md-9">{formData.lastName || '---'}</div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-3 fw-bold">Email:</div>
                      <div className="col-md-9">{formData.email || 'No email available'}</div>
                    </div>
                    <div className="row mb-3">
                      <div className="col-md-3 fw-bold">Gender:</div>
                      <div className="col-md-9">{getGenderLabel(formData.gender)}</div>
                    </div>
                  </div>
                )
              ) : (
                <form onSubmit={handlePasswordUpdate}>
                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={updating}
                    >
                      {updating ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 