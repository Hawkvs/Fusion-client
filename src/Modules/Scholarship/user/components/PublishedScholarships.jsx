import React, { useState, useEffect } from 'react';
import { Table, Title, Paper, Text, Stack } from '@mantine/core';
import { fetchMeritList } from '../../services/api';

const PublishedScholarships = () => {
  const [published, setPublished] = useState([]);

  useEffect(() => {
    fetchMeritList().then(data => {
      if (Array.isArray(data)) {
        setPublished(data);
      }
    }).catch(err => console.error(err));
  }, []);

  const rows = published.map((item, index) => (
    <Table.Tr key={item.id || index}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{item.student}</Table.Td>
      <Table.Td>{item.student_name || 'N/A'}</Table.Td>
      <Table.Td>{item.scholarship_type}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack>
      <Paper withBorder p="md" radius="md" mb="md" bg="blue.0">
        <Title order={4} mb="xs">Merit List</Title>
        <Text size="sm">Here are the scholarship results published by the convenor.</Text>
      </Paper>

      {published.length === 0 ? (
        <Text color="dimmed" align="center" mt="xl">No results published yet.</Text>
      ) : (
        <Table highlightOnHover verticalSpacing="sm" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Rank</Table.Th>
              <Table.Th>Student ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Award Type</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      )}
    </Stack>
  );
};

export default PublishedScholarships;
