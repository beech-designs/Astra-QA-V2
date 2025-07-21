// pages/api/report/[uuid].js - Retrieve Report by UUID
import fs from 'fs/promises';
import path from 'path';

const REPORTS_DIR = path.join(process.cwd(), 'data', 'reports');

export default async function handler(req, res) {
  const { uuid } = req.query;
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }
    
    const filePath = path.join(REPORTS_DIR, `${uuid}.json`);
    
    try {
      const reportData = await fs.readFile(filePath, 'utf8');
      const report = JSON.parse(reportData);
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.status(200).json(report);
      
    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return res.status(404).json({ error: 'Report not found' });
      }
      throw fileError;
    }
    
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to retrieve report' });
  }
}