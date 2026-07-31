import { QuestionDifficulty } from "@/drizzle/schema"

export function formatQuestionDifficulty(
  difficulty: QuestionDifficulty,
  t: (key: string) => string
) {
  switch (difficulty) {
    case "easy":
      return t("questionsPage.easy")
    case "medium":
      return t("questionsPage.medium")
    case "hard":
      return t("questionsPage.hard")
    default:
      throw new Error(
        `Unknown question difficulty: ${difficulty satisfies never}`
      )
  }
}
