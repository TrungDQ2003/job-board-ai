import { env } from "@/data/env/server"
import { updateJobListingApplication } from "@/features/jobListingApplications/db/jobListingsApplications"
import { createAgent, createTool, gemini } from "@inngest/agent-kit"
import { z } from "zod"

const saveApplicantRatingTool = createTool({
  name: "save-applicant-ranking",
  description:
    "Saves the applicant's ATS ranking score (1-10) for a specific job listing in the database",
  parameters: z.object({
    rating: z.number().int().min(1).max(10),
    jobListingId: z.string(),
    userId: z.string(),
  }),
  handler: async ({ jobListingId, rating, userId }) => {
    await updateJobListingApplication({ jobListingId, userId }, { rating })

    return "Successfully saved applicant ranking score."
  },
})

export const applicantRankingAgent = createAgent({
  name: "Applicant Ranking Agent",
  description:
    "Agent for ranking job applicants for specific job listings based on their resume and cover letter on a 1-10 ATS score scale.",
  system:
    "You are an expert recruitment advisor and ATS evaluator specializing in ranking job applicants for specific jobs based on their resume and cover letter. You will be provided with a user prompt that includes a user's id, resume summary/details, cover letter, and the job listing they are applying for in JSON format. Your task is to analyze how well the applicant's experience, technical skills, and cover letter match the job requirements (JD) and assign an ATS rating score from 1 to 10:\n" +
    "- 9 to 10: Outstanding / Near Perfect Match (Candidate exceeds key requirements, has strong relevant experience, and high alignment with the JD).\n" +
    "- 7 to 8: Good Match (Candidate meets most core requirements, possesses relevant technical skills and practical experience).\n" +
    "- 5 to 6: Moderate Match (Candidate meets minimum baseline requirements, but may lack some specific experience or domain knowledge).\n" +
    "- 1 to 4: Poor Match (Candidate lacks essential requirements or is unqualified for this specific position).\n\n" +
    "You MUST call the 'save-applicant-ranking' tool with the calculated rating integer (1-10), the jobListingId, and the userId, and return no further output.",
  tools: [saveApplicantRatingTool],
  model: gemini({
    model: "gemini-2.0-flash",
    apiKey: env.GEMINI_API_KEY,
  }),
})
