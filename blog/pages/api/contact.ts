import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the current session (optional)
    const session = await getServerSession(req, res, authOptions);
    
    // Validate the request body
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (message.length < 10) {
      return res.status(400).json({ error: 'Message must be at least 10 characters' });
    }
    
    // Here you would typically:
    // 1. Send an email with the contact form data
    // 2. Store the message in your database
    
    console.log('Contact form submission:', {
      name,
      email,
      subject, 
      message,
      userId: session?.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
    
    // In a real application, you might:
    // - Send email via SendGrid, AWS SES, etc.
    // - Create a record in MongoDB
    // - Notify staff via Slack/Discord webhook
    
    // For now, we'll simulate success
    return res.status(200).json({ 
      success: true,
      message: 'Contact form submitted successfully!' 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your request'
    });
  }
}
