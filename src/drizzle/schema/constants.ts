export const experienceLevels = ["junior", "mid-level", "senior"] as const
export type ExperienceLevel = (typeof experienceLevels)[number]
