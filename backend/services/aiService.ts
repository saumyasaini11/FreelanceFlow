import OpenAI from 'openai';
import { logger } from '../utils/logger';

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openai: OpenAI | null = null;
if (apiKey) {
  openai = new OpenAI({ apiKey });
} else {
  logger.warn('OPENAI_API_KEY not set — AI endpoints will return mock responses.');
}

// ─── Proposal Generator ───────────────────────────────────────────────────────
export interface ProposalInput {
  projectName: string;
  clientType: string;
  scope: string;
  budget: number;
  deadline: string;
  skills?: string[];
}

export const generateProposal = async (input: ProposalInput): Promise<string> => {
  if (!openai) {
    return `# Project Proposal — ${input.projectName}

## Overview
Thank you for considering my services for the **${input.projectName}** project. I have thoroughly reviewed your requirements and am confident I can deliver exceptional results.

## Scope of Work
${input.scope}

## Approach & Methodology
I will follow an agile, milestone-based delivery approach, ensuring regular check-ins and transparency throughout the project lifecycle.

## Timeline
Target completion: **${input.deadline}**

Key milestones:
- **Week 1**: Discovery, planning, and architecture design
- **Week 2–3**: Core development and feature implementation
- **Week 4**: Testing, revisions, and final delivery

## Investment
Project Budget: **$${input.budget.toLocaleString()}**

Payment terms: 50% upfront, 50% upon completion.

## Why Choose Me
With expertise in ${input.skills?.join(', ') || 'full-stack development'}, I bring both technical excellence and clear communication to every project.

---
*This proposal is valid for 14 days. Looking forward to working with you!*`;
  }

  const prompt = `You are a professional freelancer writing a client proposal. Write a compelling, professional project proposal in markdown format.

Project Details:
- Name: ${input.projectName}
- Client Type: ${input.clientType}
- Scope: ${input.scope}
- Budget: $${input.budget}
- Deadline: ${input.deadline}
- Skills involved: ${input.skills?.join(', ') || 'Not specified'}

Write a complete proposal with: Overview, Scope of Work, Approach & Methodology, Timeline with milestones, Investment (payment terms), and Why Choose Me. Keep it professional, confident, and tailored to the client type. Use markdown headings and bullet points.`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content ?? 'Could not generate proposal. Please try again.';
};

// ─── Rate Advisor ─────────────────────────────────────────────────────────────
export interface RateAdvisorInput {
  skills: string[];
  experienceYears: number;
  projectType: string;
  location: string;
}

export interface RateAdvisorOutput {
  hourlyMin: number;
  hourlyMax: number;
  projectMin: number;
  projectMax: number;
  reasoning: string;
  marketContext: string;
  tips: string[];
}

export const suggestRate = async (input: RateAdvisorInput): Promise<RateAdvisorOutput> => {
  if (!openai) {
    const base = 50 + input.experienceYears * 10;
    return {
      hourlyMin: base,
      hourlyMax: Math.round(base * 1.6),
      projectMin: base * 20,
      projectMax: Math.round(base * 1.6 * 30),
      reasoning: `Based on ${input.experienceYears} years of experience in ${input.skills.join(', ')}, a competitive rate in the ${input.location} market starts at $${base}/hr.`,
      marketContext: `The ${input.projectType} market in ${input.location} is competitive. Rates vary widely based on specialization and portfolio quality.`,
      tips: [
        'Always anchor high — clients expect to negotiate down.',
        'Package your services to offer clear value tiers.',
        'Raise your rates 10-15% annually as you gain experience.',
      ],
    };
  }

  const prompt = `You are a freelance rate advisor. Suggest competitive rates based on these inputs:

Skills: ${input.skills.join(', ')}
Experience: ${input.experienceYears} years
Project Type: ${input.projectType}
Location/Market: ${input.location}

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "hourlyMin": <number>,
  "hourlyMax": <number>,
  "projectMin": <number>,
  "projectMax": <number>,
  "reasoning": "<2-3 sentences explaining the rate>",
  "marketContext": "<1-2 sentences about the market>",
  "tips": ["<tip1>", "<tip2>", "<tip3>"]
}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 600,
    temperature: 0.5,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as RateAdvisorOutput;
};

// ─── Project Health Scorer ────────────────────────────────────────────────────
export interface ProjectHealthInput {
  projectName: string;
  status: string;
  progress: number;
  budget: number;
  hourlyRate: number;
  deadline: string;
  totalLoggedHours: number;
  totalBilledAmount: number;
  deliverablesDone: number;
  deliverablesTotal: number;
}

export interface ProjectHealthOutput {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  risks: { severity: 'low' | 'medium' | 'high'; message: string }[];
  recommendations: string[];
}

export const scoreProjectHealth = async (input: ProjectHealthInput): Promise<ProjectHealthOutput> => {
  const daysUntilDeadline = Math.ceil((new Date(input.deadline).getTime() - Date.now()) / 86400000);
  const budgetUsed = input.totalBilledAmount;
  const budgetRemaining = input.budget - budgetUsed;
  const completionRate = input.deliverablesTotal > 0 ? input.deliverablesDone / input.deliverablesTotal : input.progress / 100;

  if (!openai) {
    // Local heuristic scoring
    let score = 100;
    const risks: ProjectHealthOutput['risks'] = [];
    const recommendations: string[] = [];

    if (daysUntilDeadline < 0) { score -= 30; risks.push({ severity: 'high', message: 'Project is past its deadline.' }); }
    else if (daysUntilDeadline < 7) { score -= 15; risks.push({ severity: 'high', message: `Only ${daysUntilDeadline} days until deadline.` }); }
    else if (daysUntilDeadline < 14) { score -= 5; risks.push({ severity: 'medium', message: `${daysUntilDeadline} days until deadline — stay on track.` }); }

    if (budgetRemaining < 0) { score -= 25; risks.push({ severity: 'high', message: `Over budget by $${Math.abs(budgetRemaining).toFixed(0)}.` }); }
    else if (budgetRemaining < input.budget * 0.1) { score -= 10; risks.push({ severity: 'medium', message: 'Less than 10% of budget remaining.' }); }

    if (completionRate < 0.3 && daysUntilDeadline < 14) { score -= 15; risks.push({ severity: 'high', message: 'Low completion rate with tight deadline.' }); }

    if (input.totalLoggedHours === 0) { score -= 10; risks.push({ severity: 'low', message: 'No time logged yet — start tracking to monitor burn rate.' }); }

    score = Math.max(0, Math.min(100, score));

    if (score >= 85) recommendations.push('Project is on track. Keep momentum!');
    if (budgetRemaining < input.budget * 0.2) recommendations.push('Consider a budget review conversation with your client.');
    if (daysUntilDeadline < 14) recommendations.push('Prioritize remaining deliverables and flag any blockers.');
    if (input.totalLoggedHours === 0) recommendations.push('Log time daily to maintain accurate billing records.');

    return {
      score,
      grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F',
      summary: `${input.projectName} is ${input.progress}% complete with ${daysUntilDeadline > 0 ? daysUntilDeadline + ' days remaining' : 'past deadline'}.`,
      risks,
      recommendations,
    };
  }

  const prompt = `You are a project management AI. Analyze this freelance project and return a health assessment.

Project: ${input.projectName}
Status: ${input.status}
Progress: ${input.progress}%
Budget: $${input.budget}
Billed so far: $${input.totalBilledAmount}
Days until deadline: ${daysUntilDeadline}
Logged hours: ${input.totalLoggedHours}h
Deliverables: ${input.deliverablesDone}/${input.deliverablesTotal} done

Respond ONLY with valid JSON in this exact format:
{
  "score": <0-100 integer>,
  "grade": "<A|B|C|D|F>",
  "summary": "<1-2 sentences>",
  "risks": [{ "severity": "<low|medium|high>", "message": "<short risk description>" }],
  "recommendations": ["<action1>", "<action2>", "<action3>"]
}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as ProjectHealthOutput;
};
