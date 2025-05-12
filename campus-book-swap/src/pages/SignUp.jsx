import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Log the URL being used for debugging
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/local/register`;
      console.log('Registration URL:', apiUrl);
      
      // Register user with Strapi
      const response = await axios.post(apiUrl, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      console.log('Registration response:', response.data);
      
      // Extract user data and token
      const { user, jwt } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', jwt);
      
      // Update auth context
      login({
        email: user.email,
        username: user.username,
        id: user.id,
        token: jwt
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error details:', err);
      
      // More detailed error handling
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        
        if (err.response.status === 404) {
          setError('API endpoint not found. Please check your API URL configuration.');
        } else {
          setError(
            err.response?.data?.error?.message || 
            err.response?.data?.message || 
            'Registration failed. Please try again.'
          );
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.log('Error request:', err.request);
        setError('No response received from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred during registration. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Sign Up</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="block mb-1 font-medium">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
            minLength="6"
          />
          <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded`}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Already have an account? <Link to="/signin" className="text-blue-600 hover:underline">Sign In</Link>
        </p>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded text-sm">
        <p><strong>Troubleshooting:</strong> If you're seeing 404 errors, check:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>VITE_API_URL in your .env file (should be complete base URL)</li>
          <li>Strapi version (URL pattern might differ)</li>
          <li>Strapi permissions (check Public role permissions)</li>
        </ul>
      </div>
    </div>
  );
};

export default SignUp;