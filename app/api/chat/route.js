import { GoogleGenerativeAI } from '@google/generative-ai';
import Assessment from '../../../models/Assessment';
import { connectToDatabase } from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const functions = {
  get_total_assessments: async () => {
    await connectToDatabase();
    const count = await Assessment.countDocuments();
    return { total_assessments: count };
  },
  get_patients_by_age_range: async ({ min_age, max_age }) => {
    await connectToDatabase();
    const assessments = await Assessment.find({
      age: { $gte: min_age, $lte: max_age }
    }).select('patientName age gender campName');
    return { patients: assessments };
  },
  get_assessments_by_gender: async ({ gender }) => {
    await connectToDatabase();
    const assessments = await Assessment.find({ gender }).select('patientName age campName surveyStatus');
    return { assessments };
  },
  get_assessments_by_camp: async ({ camp_name }) => {
    await connectToDatabase();
    const assessments = await Assessment.find({ campName: new RegExp(camp_name, 'i') }).select('patientName age gender surveyStatus');
    return { assessments };
  },
  get_mental_health_stats: async () => {
    await connectToDatabase();
    const stats = await Assessment.aggregate([
      {
        $group: {
          _id: '$mentalRisk',
          count: { $sum: 1 },
          avg_score: { $avg: '$mentalScore' }
        }
      }
    ]);
    return { mental_health_stats: stats };
  },
  get_nutritional_supplements_stats: async () => {
    await connectToDatabase();
    const stats = await Assessment.aggregate([
      { $unwind: '$nutritionalSupplements' },
      {
        $group: {
          _id: '$nutritionalSupplements.type',
          total_quantity: { $sum: '$nutritionalSupplements.quantity' },
          count: { $sum: 1 }
        }
      }
    ]);
    return { supplements_stats: stats };
  },
  get_recent_assessments: async ({ limit = 10 }) => {
    await connectToDatabase();
    const assessments = await Assessment.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('patientName age gender campName surveyStatus createdAt');
    return { recent_assessments: assessments };
  }
};

const functionDeclarations = [
  {
    name: 'get_total_assessments',
    description: 'Get the total number of patient assessments in the database',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_patients_by_age_range',
    description: 'Get patients within a specific age range',
    parameters: {
      type: 'object',
      properties: {
        min_age: { type: 'number', description: 'Minimum age' },
        max_age: { type: 'number', description: 'Maximum age' }
      },
      required: ['min_age', 'max_age']
    }
  },
  {
    name: 'get_assessments_by_gender',
    description: 'Get assessments filtered by gender',
    parameters: {
      type: 'object',
      properties: {
        gender: { type: 'string', enum: ['male', 'female', 'other'], description: 'Gender to filter by' }
      },
      required: ['gender']
    }
  },
  {
    name: 'get_assessments_by_camp',
    description: 'Get assessments from a specific camp',
    parameters: {
      type: 'object',
      properties: {
        camp_name: { type: 'string', description: 'Name of the camp' }
      },
      required: ['camp_name']
    }
  },
  {
    name: 'get_mental_health_stats',
    description: 'Get aggregated mental health statistics',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_nutritional_supplements_stats',
    description: 'Get statistics on nutritional supplements distribution',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_recent_assessments',
    description: 'Get the most recent patient assessments',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of recent assessments to retrieve', default: 10 }
      },
      required: []
    }
  }
];

export async function POST(request) {
  const user = await getUserFromRequest();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, history = [] } = await request.json();

    // Check for specific query patterns and handle them directly
    let directResponse = null;

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('how many') && lowerMessage.includes('patient')) {
      const count = await functions.get_total_assessments();
      directResponse = `There are ${count.total_assessments} patient assessments in the database.`;
    } else if (lowerMessage.includes('age') && (lowerMessage.includes('between') || lowerMessage.includes('from'))) {
      // Extract age range
      const ageMatch = lowerMessage.match(/(\d+)\s*(?:to|and)\s*(\d+)/);
      if (ageMatch) {
        const minAge = parseInt(ageMatch[1]);
        const maxAge = parseInt(ageMatch[2]);
        const result = await functions.get_patients_by_age_range({ min_age: minAge, max_age: maxAge });
        directResponse = `Found ${result.patients.length} patients aged between ${minAge} and ${maxAge}.`;
      }
    } else if (lowerMessage.includes('mental health') && lowerMessage.includes('statistics')) {
      const stats = await functions.get_mental_health_stats();
      directResponse = `Mental health statistics: ${stats.mental_health_stats.map(s => `${s._id}: ${s.count} patients`).join(', ')}.`;
    } else if (lowerMessage.includes('camp') && lowerMessage.includes('from')) {
      // Extract camp name
      const campMatch = lowerMessage.match(/camp\s+(.+)/i);
      if (campMatch) {
        const campName = campMatch[1].trim();
        const result = await functions.get_assessments_by_camp({ camp_name: campName });
        directResponse = `Found ${result.assessments.length} assessments from camp ${campName}.`;
      }
    } else if (lowerMessage.includes('recent') && lowerMessage.includes('assessment')) {
      const result = await functions.get_recent_assessments({ limit: 5 });
      directResponse = `Here are the 5 most recent assessments: ${result.recent_assessments.map(a => `${a.patientName} (${a.age} years old)`).join(', ')}.`;
    }

    if (directResponse) {
      return Response.json({ reply: directResponse });
    }

    // For general questions, use Gemini
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.0-pro',
      systemInstruction: `You are a helpful assistant for a malnutrition program. You can help with general questions about patient care, nutrition, and health monitoring. For specific data queries about patients, assessments, or statistics, please ask the user to be more specific about what data they need.`
    });

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    return Response.json({ reply: text });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}
