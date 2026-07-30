import { useRecoilValue } from 'recoil';
import { D2I18n, ProgramConfig } from 'dhis2-semis-types'
import React, { useEffect, useMemo, useState } from "react";
import { TableDataRefetch, Modules } from "dhis2-semis-types"
import { InfoPage, SwitchButtonView, useSchoolCalendarKey } from 'dhis2-semis-components'
import { Table } from "dhis2-semis-components";
import EnrollmentActionsButtons from "../../components/enrollmentButtons/EnrollmentActionsButtons";
import { RulesEngine, useHeader, useTableData, useUrlParams, useViewPortWidth } from "dhis2-semis-functions";
import { changeDataElementType, includeFields } from '../../utils/fields/includeFields';
import useGetSelectedKeys from '../../hooks/config/useGetSelectedKeys';

interface ProgramStage {
  id: string;
  displayName: string;
}

interface FilteredStage {
  id: string;
  label: string;
}

export default function Performance({ i18n, baseUrl }: { i18n: D2I18n, baseUrl: string }) {
  const { program, dataStoreData } = useGetSelectedKeys();
  const { viewPortWidth } = useViewPortWidth();
  const { urlParameters, add } = useUrlParams();
  const refetch = useRecoilValue(TableDataRefetch);
  const [editionMode, setEditionMode] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50, totalPages: 0, totalElements: 0 })
  const [selected, setSelected] = useState<{ id: any, label: string }>({ id: dataStoreData.performance?.programStages?.[0].programStage, label: "" });
  const { academicYear, grade, class: section, schoolName, school, programStage } = urlParameters
  const { getData, tableData, loading } = useTableData({ module: Modules.Performance });
  const [filterState, setFilterState] = useState<{ dataElements: any[], attributes: any[] }>({ attributes: [], dataElements: [] });
  const { columns } = useHeader({ dataStoreData, programConfigData: program as unknown as ProgramConfig, programStage: selected.id! });
  const values = { [dataStoreData.registration.grade]: grade }
  const { academicYear: academicYearId } = useSchoolCalendarKey()

  const memoizedValues = useMemo(() => values, [JSON.stringify(values)]);

  const { runRulesEngine, updatedVariables } = RulesEngine({
    variables: columns ?? [] as any,
    values: memoizedValues,
    type: "programStage",
    program: program?.id as string,
  })

  useEffect(() => {
    if (!programStage) {
      add("programStage", dataStoreData.performance?.programStages?.[0].programStage || "");
    }
  }, [programStage])

  useEffect(() => {
    if (programStage) {
      const selectedStage = program?.programStages?.find((stage) => stage.id === programStage);
      if (selectedStage) {
        setSelected({ id: selectedStage.id, label: selectedStage.displayName });
      } else {
        setSelected({ id: "", label: "" });
      }
    } else {
      setSelected({ id: "", label: "" });
    }

  }, [programStage])

  const termSelected = program?.programStages?.find((stage) => stage.id === programStage)

  useEffect(() => {
    runRulesEngine({ overrideValues: memoizedValues, overrideVariables: columns as any })
  }, [memoizedValues])

  useEffect(() => {

    void getData({
      orgUnit: school!,
      page: pagination.page,
      pageSize: pagination.pageSize,
      otherProgramStage: programStage!,
      program: program?.id as string,
      attributeFilters: filterState.attributes,
      order: dataStoreData?.defaults.defaultOrder,
      dataElementFilters: [
        academicYear !== null ? `${academicYearId}:in:${academicYear}` : null,
        grade !== null ? `${dataStoreData.registration.grade}:in:${grade}` : null,
        section !== null ? `${dataStoreData.registration.section}:in:${section}` : null,
      ].filter((filter): filter is string => filter !== null),
      baseProgramStage: dataStoreData?.registration?.programStage as string,
    })

  }, [filterState, refetch, pagination.page, pagination.pageSize, programStage, school, section, grade, academicYear])

  useEffect(() => {
    setPagination((prev: any) => ({ ...prev, totalPages: tableData.pagination.totalPages, totalElements: tableData.pagination.totalElements }))
  }, [tableData])

  useEffect(() => {
    setSelected({ id: programStage, label: "" })
  }, [academicYear, grade, section])

  function filterProgramStages(programData: any, filterData: any): FilteredStage[] {
    return programData.programStages
      .filter((stage: ProgramStage) =>
        filterData.programStages.some((filterStage: { programStage: string }) => filterStage.programStage === stage.id)
      )
      .map((stage: ProgramStage) => ({
        id: stage.id,
        label: stage.displayName
      }));
  }

  function addProgramStageToUrl(value: any) {
    add("programStage", value.id)
  }

  const dataElementIds: any = termSelected?.programStageDataElements.map(
    (item) => item.dataElement.id
  );

  return (
    <div style={{ height: "85vh" }}>
      {
        !(Boolean(schoolName) && Boolean(school)) ?
          <InfoPage
            title={i18n.t("SEMIS-Performance")}
            sections={[
              {
                sectionTitle: i18n.t("Follow the instructions to proceed:"),
                instructions: [
                  i18n.t("Select the Organization unit you want to view data"),
                  i18n.t("Use global filters(Class, Grade and Academic Year)")
                ]
              }
            ]}
          />
          :
          <>
            <Table
              programConfig={program!}
              title={i18n.t("Performance")}
              viewPortWidth={viewPortWidth}
              columns={changeDataElementType({ headerRows: updatedVariables as unknown as any, dataElementIds })}
              tableData={includeFields({
                rowsData: tableData.data, mode: editionMode, dataElementIds, program: program!.id,
                headerRows: changeDataElementType({ headerRows: updatedVariables as unknown as any, dataElementIds }),
                performanceConfig: dataStoreData.performance,
              })}
              defaultFilterNumber={5}
              filterState={filterState}
              loading={loading}
              rightElements={<EnrollmentActionsButtons i18n={i18n} setEditionMode={setEditionMode} editionMode={editionMode} baseUrl={baseUrl} />}
              setFilterState={setFilterState}
              pagination={pagination}
              setPagination={setPagination}
              paginate={!loading}
              beforeSettings={<SwitchButtonView items={filterProgramStages(program, dataStoreData.performance)} onSelect={addProgramStageToUrl} selected={selected} setSelected={setSelected} />}
            />
          </>
      }
    </div>
  )
}
