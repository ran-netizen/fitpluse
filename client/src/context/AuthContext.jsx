import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check localStorage for saved user/token on app boot
    const storedUser = localStorage.getItem('fitness_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('fitness_user');
      }
    }
    setLoading(false);
  }, []);

  // Standard Password Login (no OTP required for regular sign in)
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to sign in',
          requireVerification: !!data.requireVerification,
          email: data.email || email
        };
      }

      setUser(data);
      localStorage.setItem('fitness_user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Step 1 of Sign Up: Create Account & Request 6-Digit OTP
  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create account' };
      }

      // Registration created/updated OTP. Verification required before login.
      return {
        success: true,
        requireVerification: true,
        email: data.email || email,
        message: data.message || 'Verification code sent to email'
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Step 2 of Sign Up: Verify 6-digit Code & Complete Sign In
  const verifyEmail = async (email, otp) => {
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Invalid verification code' };
      }

      setUser(data);
      localStorage.setItem('fitness_user', JSON.stringify(data));
      return { success: true, user: data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Resend 6-Digit Verification Code
  const resendCode = async (email) => {
    try {
      const response = await fetch('/api/auth/resend-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to resend code' };
      }

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update Weight-Based Nutrition Targets & Custom Overrides
  const updateNutritionTargets = async (targets) => {
    if (!user || !user.token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch('/api/auth/nutrition-targets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(targets)
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update nutrition targets' };
      }

      const updatedUser = {
        ...user,
        ...data,
        token: user.token // preserve token
      };

      setUser(updatedUser);
      localStorage.setItem('fitness_user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fitness_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        register,
        verifyEmail,
        resendCode,
        updateNutritionTargets,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
