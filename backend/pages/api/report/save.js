// pages/api/report/save.js - Save Report with UUID
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'data', 'reports');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const reportData = req.body;
    
    // Generate UUID
    const uuid = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Add metadata
    const report = {
      ...reportData,
      uuid,
      createdAt: timestamp,
      version: '1.0'
    };
    
    // Ensure reports directory exists
    await fs.mkdir(REPORTS_DIR, { recursive: true });
    
    // Save report to file
    const filePath = path.join(REPORTS_DIR, `${uuid}.json`);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Report saved: ${uuid}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ 
      success: true, 
      uuid,
      shareUrl: `${getBaseUrl(req)}/report/${uuid}`
    });
    
  } catch (error) {
    console.error('Save report error:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
}

function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}`;
}