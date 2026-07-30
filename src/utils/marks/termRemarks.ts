type PerformanceSubjectMapping = {
    scoreDataElement?: string
}

type TermRemarkRange = {
    optionCode?: string
    minPercentage?: number
    maxPercentage?: number
}

type PerformanceConfig = {
    subjects?: PerformanceSubjectMapping[]
    maxSubjectScore?: number
    termRemarksMapping?: {
        dataElement?: string
        ranges?: TermRemarkRange[]
    }
}

type TermRemarkDataValueProps = {
    rowData: Record<string, any>
    editedScoreDataElement: string
    editedScore: unknown
    performanceConfig?: PerformanceConfig
}

function toScore(value: unknown): number {
    if (value === null || value === undefined || value === "") return 0

    const score = Number(value)
    return Number.isFinite(score) ? score : 0
}

function getTermRemarkDataValue({
    rowData,
    editedScoreDataElement,
    editedScore,
    performanceConfig
}: TermRemarkDataValueProps) {
    const termRemarksMapping = performanceConfig?.termRemarksMapping
    const termRemarkDataElement = termRemarksMapping?.dataElement
    const ranges = termRemarksMapping?.ranges ?? []
    const scoreDataElements = performanceConfig?.subjects
        ?.map((subject) => subject.scoreDataElement)
        .filter((scoreDataElement): scoreDataElement is string => Boolean(scoreDataElement)) ?? []

    if (!termRemarkDataElement || scoreDataElements.length === 0 || ranges.length === 0) {
        return null
    }

    const maxSubjectScore = performanceConfig?.maxSubjectScore ?? 100
    if (maxSubjectScore <= 0) return null

    const totalScore = scoreDataElements.reduce((sum, scoreDataElement) => {
        const value = scoreDataElement === editedScoreDataElement
            ? editedScore
            : rowData[scoreDataElement]

        return sum + toScore(value)
    }, 0)

    const percentage = (totalScore / (scoreDataElements.length * maxSubjectScore)) * 100
    const matchedRange = ranges.find((range) =>
        percentage >= (range.minPercentage ?? 0) &&
        percentage <= (range.maxPercentage ?? 0)
    )

    if (!matchedRange?.optionCode) return null

    return {
        dataElement: termRemarkDataElement,
        value: matchedRange.optionCode
    }
}

export type { PerformanceConfig }
export { getTermRemarkDataValue }
