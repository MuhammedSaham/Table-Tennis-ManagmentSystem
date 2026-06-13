import toast from 'react-hot-toast';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{ path: string; message: string }>;
    };
    status?: number;
  };
  message?: string;
}

export const handleApiError = (error: ApiError): string => {
  // Check for validation errors from backend
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    const errors = error.response.data.errors;
    
    // Group errors by field
    const errorMessages: string[] = [];
    
    errors.forEach((err: { path: string; message: string }) => {
      // Add safety check for err.path
      const field = err.path ? err.path.replace('body.', '') : 'unknown';
      
      // Convert technical messages to user-friendly ones
      switch (field) {
        case 'email':
          if (err.message.includes('invalid')) {
            errorMessages.push('Please enter a valid email address (e.g., name@example.com)');
          } else if (err.message.includes('exists')) {
            errorMessages.push('This email is already registered. Please login or use a different email.');
          } else {
            errorMessages.push('Please enter a valid email address');
          }
          break;
          
        case 'password':
          if (err.message.includes('8 characters')) {
            errorMessages.push('Password must be at least 8 characters long');
          } else if (err.message.includes('uppercase')) {
            errorMessages.push('Password must contain at least one uppercase letter (A-Z)');
          } else if (err.message.includes('lowercase')) {
            errorMessages.push('Password must contain at least one lowercase letter (a-z)');
          } else if (err.message.includes('number')) {
            errorMessages.push('Password must contain at least one number (0-9)');
          } else {
            errorMessages.push('Please choose a stronger password');
          }
          break;
          
        case 'firstName':
          errorMessages.push('Please enter your first name');
          break;
          
        case 'lastName':
          errorMessages.push('Please enter your last name');
          break;
          
        case 'role':
          errorMessages.push('Please select a valid role');
          break;
          
        case 'startDate':
          errorMessages.push('Please select a valid start date');
          break;
          
        case 'endDate':
          errorMessages.push('Please select a valid end date');
          break;
          
        case 'registrationDeadline':
          errorMessages.push('Please select a valid registration deadline');
          break;
          
        default:
          errorMessages.push(err.message);
      }
    });
    
    // Show first error as toast
    if (errorMessages.length > 0) {
      toast.error(errorMessages[0]);
    }
    
    return errorMessages[0];
  }
  
  // Handle specific status codes
  if (error.response?.status === 401) {
    toast.error('Session expired. Please login again.');
    return 'Authentication required';
  }
  
  if (error.response?.status === 403) {
    toast.error("You don't have permission to perform this action");
    return 'Permission denied';
  }
  
  if (error.response?.status === 404) {
    toast.error('Resource not found');
    return 'Not found';
  }
  
  if (error.response?.status === 400) {
    const message = error.response?.data?.message || 'Bad request. Please check your input.';
    toast.error(message);
    return message;
  }
  
  if (error.response?.status === 500) {
    toast.error('Server error. Please try again later.');
    return 'Server error';
  }
  
  // Handle generic errors
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  toast.error(message);
  return message;
};

// Success message helper
export const showSuccess = (message: string) => {
  toast.success(message);
};

// Info message helper
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
  });
};