type SubjectMapping = {
    scoreDataElement?: string
    gradeDataElement?: string
    universal?: boolean
}

type StandardGroup = {
    optionCode?: string
    standards?: string[]
    subjects?: string[]
}

type PerformanceConfig = {
    subjects?: SubjectMapping[]
    standardGroupMapping?: {
        standardGroupOptionSet?: string
        groups?: StandardGroup[]
    }
}

/**
 * Resolves which dataElement ids (both score and paired grade DE) apply to a student in the
 * given gradeCode, per performanceConfig.standardGroupMapping.
 *
 * Returns null when no restriction should be applied — either the mapping isn't configured yet,
 * or gradeCode doesn't match any configured group. Callers should treat null as "don't narrow
 * further" rather than "no subjects apply".
 */
function subjectsForGrade(performanceConfig: PerformanceConfig | undefined, gradeCode: string | null | undefined): Set<string> | null {
    const groups = performanceConfig?.standardGroupMapping?.groups
    if (!groups || groups.length === 0 || !gradeCode) return null

    const group = groups.find((g) => (g.standards ?? []).includes(gradeCode))
    if (!group) return null

    const allSubjects = performanceConfig?.subjects ?? []
    const applicableScoreIds = new Set([
        ...(group.subjects ?? []),
        ...allSubjects
            .filter((subject) => subject.universal === true)
            .map((subject) => subject.scoreDataElement)
            .filter((id): id is string => Boolean(id)),
    ])

    const allowedIds = new Set<string>()
    allSubjects.forEach((subject) => {
        if (subject.scoreDataElement && applicableScoreIds.has(subject.scoreDataElement)) {
            allowedIds.add(subject.scoreDataElement)
            if (subject.gradeDataElement) allowedIds.add(subject.gradeDataElement)
        }
    })

    return allowedIds
}

export type { PerformanceConfig as SubjectsForGradeConfig }
export { subjectsForGrade }
