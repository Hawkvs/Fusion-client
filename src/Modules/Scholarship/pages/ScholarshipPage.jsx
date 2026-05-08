import React, { useState } from 'react';
import ScholarshipTypesTable from '../components/tables/ScholarshipTypesTable';
import StudentApplicationsList from '../components/tables/StudentApplicationsList';
import AssistantApplicationsTable from '../components/tables/AssistantApplicationsTable';
import ConvenerApplicationsTable from '../components/tables/ConvenerApplicationsTable';
import ConvenerCatalog from '../components/tables/ConvenerCatalog';
import MeritList from '../components/tables/MeritList';
import AwardsAndScholarshipCatalog from '../user/components/AwardsAndScholarshipCatalog';
import ConvenorAwardsAndScholarshipCatalog from '../convenor/components/AwardsAndScholarshipCatalogC';
import PublishedScholarships from '../user/components/PublishedScholarships';
import { Title, Flex, Text } from '@mantine/core';
import { useSelector } from 'react-redux';
import ModuleTabs from '../../../components/moduleTabs';

const ScholarshipPage = () => {
  const userRole = useSelector((state) => state.user.role);
  const [activeTab, setActiveTab] = useState('0');

  const isStudent = userRole === 'student';
  const isAssistant = userRole === 'spacsassistant';
  const isConvenor = userRole === 'spacsconvenor';

  let tabs = [];
  let components = [];

  if (isStudent) {
    tabs = [
      { title: 'Scholarship Types' },
      { title: 'Awards' },
      { title: 'Applications' },
      { title: 'Merit List' },
    ];
    components = [
      <ScholarshipTypesTable key="types" />,
      <AwardsAndScholarshipCatalog key="awards" />,
      <StudentApplicationsList key="apps" />,
      <PublishedScholarships key="published" />,
    ];
  } else if (isAssistant) {
    tabs = [{ title: 'Scholarship Types' }, { title: 'Applications' }];
    components = [<ScholarshipTypesTable key="types" />, <AssistantApplicationsTable key="apps" />];
  } else if (isConvenor) {
    tabs = [
      { title: 'Scholarship Types' },
      { title: 'Awards' },
      { title: 'Applications' },
      { title: 'Merit List' },
    ];
    components = [
      <ConvenerCatalog key="types" />,
      <ConvenorAwardsAndScholarshipCatalog key="awards" />,
      <ConvenerApplicationsTable key="apps" />,
      <MeritList key="merit_list" />,
    ];
  }

  const ActiveComponent = components[parseInt(activeTab, 10)];

  return (
    <div style={{ padding: '20px' }}>
      <Flex justify="space-between" align="center" mb="lg">
        <Title order={2}>Scholarship Portal</Title>
      </Flex>

      {tabs.length > 0 && (
        <>
          <ModuleTabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
          <div style={{ marginTop: '20px' }}>
            {ActiveComponent}
          </div>
        </>
      )}

      {(!isStudent && !isConvenor && !isAssistant) && (
        <Text color="dimmed" mt="md">You do not have the required access to view this portal.</Text>
      )}
    </div>
  );
};

export default ScholarshipPage;
