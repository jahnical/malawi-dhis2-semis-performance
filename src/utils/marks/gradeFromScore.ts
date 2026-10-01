type SubjectMapping = {
    scoreDataElement?: string
    gradeDataElement?: string
}

type GradeRange = {
    optionCode?: string
    minScore?: number
    maxScore?: number
}

type PerformanceConfig = {
    subjects?: SubjectMapping[]
    gradeMapping?: {
        ranges?: GradeRange[]
    }
}

type GradeDataValueProps = {
    editedScoreDataElement: string
    editedScore: unknown
    performanceConfig?: PerformanceConfig
}

function toScore(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null

    const score = Number(value)
    return Number.isFinite(score) ? score : null
}

/**
 * Resolves the paired grade dataElement's value from an edited score (mirrors Android's
 * resolveGradeCode). Returns null if there's no paired grade dataElement, or no range matches.
 */
function getGradeDataValue({
    editedScoreDataElement,
    editedScore,
    performanceConfig
}: GradeDataValueProps) {
    const gradeDataElement = performanceConfig?.subjects
        ?.find((subject) => subject.scoreDataElement === editedScoreDataElement)
        ?.gradeDataElement

    if (!gradeDataElement) return null

    const score = toScore(editedScore)
    if (score === null) return null

    const ranges = performanceConfig?.gradeMapping?.ranges ?? []
    const matchedRange = ranges.find((range) =>
        score >= (range.minScore ?? 0) &&
        score <= (range.maxScore ?? 0)
    )

    if (!matchedRange?.optionCode) return null

    return {
        dataElement: gradeDataElement,
        value: matchedRange.optionCode
    }
}

export type { PerformanceConfig as GradeFromScoreConfig }
export { getGradeDataValue }
