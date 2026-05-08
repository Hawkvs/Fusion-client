import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Title, Paper, Text, Stack, Checkbox, Select } from '@mantine/core';
import { fetchAllMcmApplications, updateMeritList, fetchMeritList } from '../../services/api';

const MeritList = () => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [publishedIds, setPublishedIds] = useState([]);
  const [batchFilter, setBatchFilter] = useState('');

  useEffect(() => {
    Promise.all([fetchAllMcmApplications(), fetchMeritList()]).then(([appData, meritData]) => {
      if (Array.isArray(appData)) {
        appData.sort((a, b) => (b.cpi || 0) - (a.cpi || 0));
        setApplications(appData);
        setFilteredApps(appData);
      }
      if (Array.isArray(meritData)) {
        const pubIds = meritData.map(m => m.id);
        setPublishedIds(pubIds);
        setSelectedIds(pubIds);
      }
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!applications) return;
    let result = applications;
    if (batchFilter) {
      result = result.filter(app => app.batch === batchFilter);
    }
    setFilteredApps(result);
  }, [batchFilter, applications]);

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(v => v !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePublish = async () => {
    try {
      const publishedApps = applications.filter(app => selectedIds.includes(app.id));
      await updateMeritList(publishedApps);
      setPublishedIds(selectedIds);
      alert(`Successfully published results for ${selectedIds.length} students.`);
    } catch (err) {
      console.error(err);
      alert('Failed to publish results.');
    }
  };

  const rows = filteredApps.map((item, index) => (
    <Table.Tr key={item.id || index}>
      <Table.Td>
        <Checkbox checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} />
      </Table.Td>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{item.student}</Table.Td>
      <Table.Td>{item.student_name || 'N/A'}</Table.Td>
      <Table.Td>{item.cpi}</Table.Td>
      <Table.Td>{item.scholarship_type}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack>
      <Paper withBorder p="md" radius="md" mb="md" bg="blue.0">
        <Title order={4} mb="xs">Merit List & Award Finalization</Title>
        <Text size="sm" mb="md">Select final awardees and publish the results.</Text>
        <Group>
          <Select label="Filter by Batch" placeholder="All" value={batchFilter} onChange={setBatchFilter} data={['2021', '2022', '2023', '2024']} clearable />          </Group>
      </Paper>

      <Table highlightOnHover verticalSpacing="sm" striped>
        <Table.Thead>          <Table.Tr>
            <Table.Th></Table.Th>
            <Table.Th>Rank</Table.Th>
            <Table.Th>Student ID</Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>CPI</Table.Th>
            <Table.Th>Award Type</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      
      <Group mt="md">
        <Button color="green" onClick={handlePublish}>Publish Results</Button>
      </Group>
    </Stack>
  );
};

export default MeritList;
