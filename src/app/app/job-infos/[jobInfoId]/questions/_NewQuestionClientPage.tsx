"use client"

import { BackLink } from "@/components/BackLink"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { Button } from "@/components/ui/button"
import { LoadingSwap } from "@/components/ui/loading-swap"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  JobInfoTable,
  questionDifficulties,
  QuestionDifficulty,
} from "@/drizzle/schema"
import { formatQuestionDifficulty } from "@/features/questions/formatters"
import { useMemo, useState } from "react"
import { useCompletion } from "@ai-sdk/react"
import { errorToast } from "@/lib/errorToast"
import z from "zod"
import { useLanguage } from "@/context/LanguageContext"

type Status = "awaiting-answer" | "awaiting-difficulty" | "init"

export function NewQuestionClientPage({
  jobInfo,
}: {
  jobInfo: Pick<typeof JobInfoTable.$inferSelect, "id" | "name" | "title">
}) {
  const { t } = useLanguage()
  const [status, setStatus] = useState<Status>("init")
  const [answer, setAnswer] = useState<string | null>(null)

  const {
    complete: generateQuestion,
    completion: question,
    setCompletion: setQuestion,
    isLoading: isGeneratingQuestion,
    data,
  } = useCompletion({
    api: "/api/ai/questions/generate-question",
    onFinish: () => {
      setStatus("awaiting-answer")
    },
    onError: error => {
      errorToast(error.message)
    },
  })

  const {
    complete: generateFeedback,
    completion: feedback,
    setCompletion: setFeedback,
    isLoading: isGeneratingFeedback,
  } = useCompletion({
    api: "/api/ai/questions/generate-feedback",
    onFinish: () => {
      setStatus("awaiting-difficulty")
    },
    onError: error => {
      errorToast(error.message)
    },
  })

  const questionId = useMemo(() => {
    const item = data?.at(-1)
    if (item == null) return null
    const parsed = z.object({ questionId: z.string() }).safeParse(item)
    if (!parsed.success) return null

    return parsed.data.questionId
  }, [data])

  return (
    <div className="flex flex-col w-full h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="w-full px-6 py-3 border-b flex items-center justify-between gap-4 bg-card/40 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-3">
          <BackLink href={`/app/job-infos/${jobInfo.id}`}>
            {jobInfo.name}
          </BackLink>
        </div>
        <Controls
          t={t}
          reset={() => {
            setStatus("init")
            setQuestion("")
            setFeedback("")
            setAnswer(null)
          }}
          disableAnswerButton={
            answer == null || answer.trim() === "" || questionId == null
          }
          status={status}
          isLoading={isGeneratingFeedback || isGeneratingQuestion}
          generateFeedback={() => {
            if (answer == null || answer.trim() === "" || questionId == null)
              return

            generateFeedback(answer?.trim(), { body: { questionId } })
          }}
          generateQuestion={difficulty => {
            setQuestion("")
            setFeedback("")
            setAnswer(null)
            generateQuestion(difficulty, { body: { jobInfoId: jobInfo.id } })
          }}
        />
      </div>
      <div className="flex-1 w-full overflow-hidden">
        <QuestionContainer
          t={t}
          question={question}
          feedback={feedback}
          answer={answer}
          status={status}
          setAnswer={setAnswer}
        />
      </div>
    </div>
  )
}

function QuestionContainer({
  t,
  question,
  feedback,
  answer,
  status,
  setAnswer,
}: {
  t: (keyPath: string) => string
  question: string | null
  feedback: string | null
  answer: string | null
  status: Status
  setAnswer: (value: string) => void
}) {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      <ResizablePanel id="question-and-feedback" defaultSize={50} minSize={20}>
        {feedback ? (
          <ResizablePanelGroup direction="vertical" className="h-full w-full">
            <ResizablePanel id="question" defaultSize={40} minSize={15}>
              <div className="flex flex-col h-full border-b">
                <div className="px-6 py-2.5 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("questionsPage.title") || "Câu hỏi"}
                </div>
                <ScrollArea className="flex-1 h-full">
                  <div className="p-6 prose dark:prose-invert max-w-none text-base leading-relaxed">
                    <MarkdownRenderer>{question}</MarkdownRenderer>
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel id="feedback" defaultSize={60} minSize={20}>
              <div className="flex flex-col h-full bg-muted/10">
                <div className="px-6 py-2.5 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("interviewsPage.feedback") || "Đánh giá & Nhận xét của AI"}
                </div>
                <ScrollArea className="flex-1 h-full">
                  <div className="p-6 prose dark:prose-invert max-w-none text-base leading-relaxed">
                    <MarkdownRenderer>{feedback}</MarkdownRenderer>
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex flex-col h-full">
            <div className="px-6 py-2.5 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("questionsPage.title") || "Câu hỏi"}
            </div>
            <ScrollArea className="flex-1 h-full">
              {status === "init" && question == null ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-8 text-center text-muted-foreground">
                  <p className="text-base md:text-lg max-w-md">
                    {t("questionsPage.startInstruction")}
                  </p>
                </div>
              ) : (
                question && (
                  <div className="p-6 md:p-8 prose dark:prose-invert max-w-none text-base md:text-lg leading-relaxed font-normal">
                    <MarkdownRenderer>{question}</MarkdownRenderer>
                  </div>
                )
              )}
            </ScrollArea>
          </div>
        )}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="answer" defaultSize={50} minSize={20}>
        <div className="flex flex-col h-full bg-background">
          <div className="px-6 py-2.5 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("questionsPage.answer") || "Câu trả lời của bạn"}
          </div>
          <div className="flex-1 h-full relative">
            <Textarea
              disabled={status !== "awaiting-answer"}
              onChange={e => setAnswer(e.target.value)}
              value={answer ?? ""}
              placeholder={t("questionsPage.typePlaceholder")}
              className="w-full h-full resize-none border-none rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed p-6 md:p-8 shadow-none focus:outline-none"
            />
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function Controls({
  t,
  status,
  isLoading,
  disableAnswerButton,
  generateQuestion,
  generateFeedback,
  reset,
}: {
  t: (keyPath: string) => string
  disableAnswerButton: boolean
  status: Status
  isLoading: boolean
  generateQuestion: (difficulty: QuestionDifficulty) => void
  generateFeedback: () => void
  reset: () => void
}) {
  return (
    <div className="flex gap-2">
      {status === "awaiting-answer" ? (
        <>
          <Button
            onClick={reset}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <LoadingSwap isLoading={isLoading}>{t("questionsPage.skip")}</LoadingSwap>
          </Button>
          <Button
            onClick={generateFeedback}
            disabled={disableAnswerButton}
            size="sm"
          >
            <LoadingSwap isLoading={isLoading}>{t("questionsPage.answer")}</LoadingSwap>
          </Button>
        </>
      ) : (
        questionDifficulties.map(difficulty => (
          <Button
            key={difficulty}
            size="sm"
            disabled={isLoading}
            onClick={() => generateQuestion(difficulty)}
          >
            <LoadingSwap isLoading={isLoading}>
              {formatQuestionDifficulty(difficulty, t)}
            </LoadingSwap>
          </Button>
        ))
      )}
    </div>
  )
}
