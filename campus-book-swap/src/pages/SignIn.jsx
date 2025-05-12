import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Connect to Strapi backend using our authAPI
      const response = await authAPI.login({
        email: email,
        password: password
      });
      
      // Extract user data and token
      const { user, jwt } = response.data;
      
      // Store the token in localStorage for future API calls
      localStorage.setItem('token', jwt);
      
      // Update auth context with user info
      login({
        email: user.email,
        username: user.username,
        id: user.id,
        token: jwt
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error?.message ||
        'Invalid credentials. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Back to Home
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium rounded`}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;