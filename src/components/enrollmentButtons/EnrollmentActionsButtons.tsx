import React, { useState } from 'react'
import { Form } from 'react-final-form';
import ShowStats from '../stats/showStats';
import { Tooltip } from '@mui/material';
import styles from './enrollmentActionsButtons.module.css'
import { Button, ButtonStrip, IconUserGroup16, IconEdit24 } from "@dhis2/ui";
import { useCheckFilters, useGetSectionTypeLabel, useShowAlerts, useUrlParams } from 'dhis2-semis-functions';
import { DataExporter, DataImporter, CustomDropdown as DropdownButton, useSchoolCalendarKey } from 'dhis2-semis-components';
import EditOffIcon from '@mui/icons-material/EditOff';
import useGetSelectedKeys from '../../hooks/config/useGetSelectedKeys';
import { D2I18n } from 'dhis2-semis-types';

function EnrollmentActionsButtons({ setEditionMode, editionMode, i18n, baseUrl }: { i18n: D2I18n, setEditionMode: (editionMode: boolean) => void, editionMode: boolean, baseUrl: string }) {
    const { urlParameters } = useUrlParams();
    const { school: orgUnit, class: section, grade, academicYear } = urlParameters;
    const { sectionName } = useGetSectionTypeLabel();
    const [stats, setStats] = useState<{ posted: number, conflicts: any[] }>({ posted: 0, conflicts: [] })
    const [open, setOpen] = useState<boolean>(false)
    const { dataStoreData: selectedDataStoreKey, program: programData } = useGetSelectedKeys()
    const { hide, show } = useShowAlerts()
    const { areAllSelected } = useCheckFilters({ filters: (selectedDataStoreKey.filters.dataElements ?? []) as unknown as any })
    const { academicYear: academicYearId } = useSchoolCalendarKey()

    const showAlert = (error: any) => {
        show({ message: `Unknown error: ${error}`, type: { critical: true } })
        setTimeout(hide, 5000);
    }

    const enrollmentOptions: any = [
        {
            label: <DataImporter
                baseURL={baseUrl}
                label={i18n.t('Bulk Performance')}
                module='performance'
                onError={(e: any) => { showAlert(e) }}
                programConfig={programData!}
                sectionType={sectionName}
                selectedSectionDataStore={selectedDataStoreKey}
                updating={false}
                title={i18n.t("Import Performance")}

            />,
            divider: true,
            disabled: false,
        },
        {
            label: <DataExporter
                Form={Form}
                baseURL={baseUrl}
                eventFilters={[
                    ...(academicYear ? [`${academicYearId}:in:${academicYear}`] : []),
                    ...(grade ? [`${selectedDataStoreKey.registration.grade}:in:${grade}`] : []),
                    ...(section ? [`${selectedDataStoreKey.registration.section}:in:${section}`] : []),
                ]}
                label={i18n.t('Export learners performace')}
                module='performance'
                onError={(e: any) => { showAlert(e) }}
                programConfig={programData!}
                sectionType={sectionName}
                selectedSectionDataStore={selectedDataStoreKey}
                stagesToExport={selectedDataStoreKey.performance?.programStages.map(x => x.programStage)!}
            />,
            divider: false,
            disabled: false,
        },
    ];

    return (
        <div className={styles.container}>
            <ShowStats open={open} setOpen={setOpen} stats={stats} />
            <ButtonStrip className={styles.work_buttons}>

                <Tooltip title={orgUnit === null ? i18n.t("Please select an organisation unit before") : ""}>
                    <Button
                        onClick={() => setEditionMode(!editionMode)}
                        icon={editionMode ? <EditOffIcon /> : <IconEdit24 />}
                    >
                        <span>{editionMode ?i18n.t("Disable Edition Mode") :i18n.t("Allow Edit Mode")}</span>
                    </Button >
                </Tooltip>

                <Tooltip title={!areAllSelected() ? i18n.t("Please select all filters"): ""} >
                    <span>
                        <DropdownButton
                            name={<span className={styles.work_buttons_text}>{i18n.t("Bulk Performance")}</span> as unknown as string}
                            disabled={!!(orgUnit == undefined || !areAllSelected() || academicYear == undefined)}
                            icon={<IconUserGroup16 />}
                            options={enrollmentOptions}
                        />
                    </span>
                </Tooltip>

            </ButtonStrip>
        </div>
    )
}

export default EnrollmentActionsButtons
