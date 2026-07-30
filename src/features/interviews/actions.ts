"use server"

import { cookies } from "next/headers"
import { getCurrentUser } from "@/services/clerk/lib/getCurrentUser"
import { cacheTag } from "next/dist/server/use-cache/cache-tag"
import { getJobInfoIdTag } from "../jobInfos/dbCache"
import { db } from "@/drizzle/db"
import { and, eq } from "drizzle-orm"
import { InterviewTable, JobInfoTable } from "@/drizzle/schema"
import { insertInterview, updateInterview as updateInterviewDb, deleteInterview as deleteInterviewDb } from "./db"
import { getInterviewIdTag } from "./dbCache"
import { canCreateInterview } from "./permissions"
import { PLAN_LIMIT_MESSAGE, RATE_LIMIT_MESSAGE } from "@/lib/errorToast"
import { env } from "@/data/env/server"
import arcjet, { tokenBucket, request } from "@arcjet/next"
import { generateAiInterviewFeedback } from "@/services/ai/interviews"
import { generateText } from "ai"
import { google } from "@/services/ai/models/google"

const aj = arcjet({
  characteristics: ["userId"],
  key: env.ARCJET_KEY,
  rules: [
    tokenBucket({
      capacity: 12,
      refillRate: 4,
      interval: "1d",
      mode: "LIVE",
    }),
  ],
})

export async function createInterview({
  jobInfoId,
}: {
  jobInfoId: string
}): Promise<{ error: true; message: string } | { error: false; id: string }> {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  if (!(await canCreateInterview())) {
    return {
      error: true,
      message: PLAN_LIMIT_MESSAGE,
    }
  }

  const decision = await aj.protect(await request(), {
    userId,
    requested: 1,
  })

  if (decision.isDenied()) {
    return {
      error: true,
      message: RATE_LIMIT_MESSAGE,
    }
  }

  const jobInfo = await getJobInfo(jobInfoId, userId)
  if (jobInfo == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await insertInterview({ jobInfoId, duration: "00:00:00" })

  return { error: false, id: interview.id }
}

export async function updateInterview(
  id: string,
  data: {
    humeChatId?: string
    duration?: string
    messagesJson?: string
  }
) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await getInterview(id, userId)
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  await updateInterviewDb(id, data)

  return { error: false }
}

export async function getNextInterviewResponse({
  jobInfo,
  messages,
  language = "vi",
}: {
  jobInfo: {
    title: string | null
    description: string
    experienceLevel: "no-experience" | "junior" | "mid" | "senior" | "lead"
  }
  messages: { role: "user" | "assistant"; text: string }[]
  language?: string
}) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
      text: ""
    }
  }

  const conversation = messages.map(m => ({
    role: m.role,
    content: m.text,
  }))

  const systemPrompt = `You are a professional and friendly job interviewer. Your task is to conduct a mock interview with the candidate for the following role:
  
Job Title: ${jobInfo.title || "Not Specified"}
Job Description: ${jobInfo.description}
Experience Level: ${jobInfo.experienceLevel}

Guidelines:
- Act like a real interviewer. Be polite, professional, and conversational.
- Ask ONE question at a time.
- Make sure your questions are highly relevant to the job description and experience level.
- Keep your questions and responses very concise (under 2-3 sentences max) to ensure natural flow.
- Follow up on the candidate's previous responses if appropriate, or move on to the next question.
- IMPORTANT: Since your responses will be read aloud by a Vietnamese text-to-speech reader, avoid using raw code symbols, colons, or markdown backticks inside code terms (e.g. write "display block" instead of "display: block" or "'display: block'"). Keep all technical terms in plain text.
- IMPORTANT: You must interact entirely in ${language === "vi" ? "Vietnamese (Tiếng Việt)" : "English"}. Respond in ${language === "vi" ? "Vietnamese" : "English"}.`

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: JSON.stringify(conversation),
    })

    return { error: false, text }
  } catch (err) {
    console.error(err)
    return { error: true, message: "Failed to generate AI response", text: "" }
  }
}

export async function generateInterviewFeedback(interviewId: string) {
  const { userId, user } = await getCurrentUser({ allData: true })
  if (userId == null || user == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await getInterview(interviewId, userId)
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  if (interview.humeChatId == null && interview.messagesJson == null) {
    return {
      error: true,
      message: "Interview has not been completed yet",
    }
  }

  const cookieStore = await cookies()
  const language = cookieStore.get("lang")?.value || "vi"

  const feedback = await generateAiInterviewFeedback({
    humeChatId: interview.humeChatId,
    messagesJson: interview.messagesJson,
    jobInfo: interview.jobInfo,
    userName: user.name,
    language,
  })

  if (feedback == null) {
    return {
      error: true,
      message: "Failed to generate feedback",
    }
  }

  await updateInterviewDb(interviewId, { feedback })

  return { error: false }
}

export async function deleteInterview(id: string) {
  const { userId } = await getCurrentUser()
  if (userId == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  const interview = await getInterview(id, userId)
  if (interview == null) {
    return {
      error: true,
      message: "You don't have permission to do this",
    }
  }

  await deleteInterviewDb(id)

  return { error: false }
}

async function getJobInfo(id: string, userId: string) {
  "use cache"
  cacheTag(getJobInfoIdTag(id))

  return db.query.JobInfoTable.findFirst({
    where: and(eq(JobInfoTable.id, id), eq(JobInfoTable.userId, userId)),
  })
}

async function getInterview(id: string, userId: string) {
  "use cache"
  cacheTag(getInterviewIdTag(id))

  const interview = await db.query.InterviewTable.findFirst({
    where: eq(InterviewTable.id, id),
    with: {
      jobInfo: {
        columns: {
          id: true,
          userId: true,
          description: true,
          title: true,
          experienceLevel: true,
        },
      },
    },
  })

  if (interview == null) return null

  cacheTag(getJobInfoIdTag(interview.jobInfo.id))
  if (interview.jobInfo.userId !== userId) return null

  return interview
}
