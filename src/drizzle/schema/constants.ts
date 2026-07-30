export const experienceLevels = ["no-experience", "junior", "mid-level", "senior"] as const
export type ExperienceLevel = (typeof experienceLevels)[number]

