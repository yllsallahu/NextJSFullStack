import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define the form schema
const contactSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  subject: yup.string().required('Subject is required'),
  message: yup.string().required('Message is required').min(10, 'Message must be at least 10 characters'),
}).required();

// Define the form data type
type ContactFormData = yup.InferType<typeof contactSchema>;

interface ContactFormProps {
  onContactSuccess?: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onContactSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // Send the contact form data to your API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      const result = await response.json();
      
      // Handle success
      setSubmitStatus({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.',
      });
      
      // Reset the form
      reset();
      
      // Call the success callback if provided
      if (onContactSuccess) {
        onContactSuccess();
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Us</h2>
      
      {submitStatus && (
        <div className={`mb-6 p-4 rounded-md ${submitStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <p className="flex items-center">
            {submitStatus.success ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {submitStatus.message}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            className={`block w-full px-4 py-2 mt-1 text-gray-900 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Your name"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={`block w-full px-4 py-2 mt-1 text-gray-900 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="your.email@example.com"
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            className={`block w-full px-4 py-2 mt-1 text-gray-900 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="What is this regarding?"
            {...register('subject')}
          />
          {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            className={`block w-full px-4 py-2 mt-1 text-gray-900 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Your message here..."
            {...register('message')}
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
