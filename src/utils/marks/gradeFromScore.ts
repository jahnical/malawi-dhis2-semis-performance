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
 * Resolves the paired grade dataElement's value from an edited score, mirroring Android's
 * PerformanceViewModel.resolveGradeCode/fieldState - web previously had no equivalent, so a
 * teacher could save a grade that disagreed with what the same score auto-resolves to on
 * mobile. Returns null when the edited dataElement has no paired grade dataElement
 * configured, or the score doesn't fall in any configured range.
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
