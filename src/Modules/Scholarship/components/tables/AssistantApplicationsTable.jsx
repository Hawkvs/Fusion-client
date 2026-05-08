import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Flex, Modal, Textarea, Checkbox, Stack, Group, Title, Text, Grid, Paper, MultiSelect } from '@mantine/core';
import { fetchAllMcmApplications, updateScholarshipStatus } from '../../services/api';

const AssistantApplicationsTable = () => {
  const [opened, setOpened] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [requestedDocs, setRequestedDocs] = useState([]);
  const [verifiedDocs, setVerifiedDocs] = useState({ income: false, aadhar: false, marksheet: false });
  const [applications, setApplications] = useState([]); // Empty state by default

  const loadApplications = async () => {
    try {
      const data = await fetchAllMcmApplications();
      if (Array.isArray(data)) {
        // Assistant should only see Submitted or Under Review applications
        const relevantDocs = data.filter(app => ['SUBMITTED', 'UNDER_REVIEW', 'INCOMPLETE'].includes(app.status || 'INCOMPLETE'));
        setApplications(relevantDocs);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleOpenDetails = (app) => {
    setSelectedApp(app);
    setRemarks('');
    setRequestedDocs([]);
    setVerifiedDocs({ income: false, aadhar: false, marksheet: false });
    setOpened(true);
  };

  const handleStatusUpdate = async (status) => {
    if (status === 'NEEDS_INFO' && requestedDocs.length === 0) {
      alert("Please select at least one specific document to request from the student.");
      return;
    }
    try {
      const finalRemarks = JSON.stringify({
        text: remarks,
        requested: requestedDocs
      });
      await updateScholarshipStatus(selectedApp.id, status, finalRemarks, selectedApp.scholarship_type);
      alert(`Status updated to ${status}. A notification has been sent to the student.`);
      loadApplications();
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update status.");
    }
    setOpened(false);
  };

  const rows = applications.length > 0 ? (
    applications.map((app, idx) => (
      <Table.Tr key={app.id || idx}>
        <Table.Td>{app.student}</Table.Td>
        <Table.Td>{app.scholarship_type || 'Merit Cum Means (MCM)'}</Table.Td>
        <Table.Td>{app.date ? `${new Date(app.date).getFullYear()}-${new Date(app.date).getFullYear() + 1}` : 'N/A'}</Table.Td>
        <Table.Td>
           <Badge color={app.status === 'FORWARDED' ? 'green' : app.status === 'NEEDS_INFO' ? 'red' : 'yellow'}>
            {app.status || 'PENDING'}
          </Badge>
        </Table.Td>
        <Table.Td>{app.date}</Table.Td>
        <Table.Td>
          <Button size="xs" variant="light" onClick={() => handleOpenDetails(app)}>Verify</Button>
        </Table.Td>
      </Table.Tr>
    ))
  ) : (
    <Table.Tr>
      <Table.Td colSpan="7" style={{ textAlign: 'center', color: 'gray' }}>
        No applications available for review.
      </Table.Td>
    </Table.Tr>
  );

  return (
    <div>
      <Table highlightOnHover verticalSpacing="sm" striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Student ID</Table.Th>
            <Table.Th>Scholarship Name</Table.Th>
            <Table.Th>Academic Year</Table.Th>

            <Table.Th>Status</Table.Th>
            <Table.Th>Applied Date</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title="Application Details" size="xl">
        {selectedApp && (
          <Stack spacing="md">
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Grid>
                <Grid.Col span={6}><Text size="sm" weight={500}>Student ID: {selectedApp.student || selectedApp.studentId || 'N/A'}</Text></Grid.Col>
                <Grid.Col span={6}><Text size="sm" weight={500}>Scholarship: {selectedApp.scholarship_type || selectedApp.name || 'Merit Cum Means (MCM)'}</Text></Grid.Col>
                <Grid.Col span={6}><Text size="sm" weight={500}>Reported CPI: {selectedApp.cpi || 'N/A'}</Text></Grid.Col>
                <Grid.Col span={6}><Text size="sm" weight={500}>Family Income: ₹{selectedApp.annual_income || selectedApp.income || '0'}</Text></Grid.Col>
              </Grid>
            </Paper>

            <Title order={5}>Eligibility Validation</Title>
            {!String(selectedApp.scholarship_type || "").includes("Single") && (
              <Checkbox label={`CPI >= 8.0 (Current: ${selectedApp.cpi || '8.5'})`} checked={parseFloat(selectedApp.cpi || '8.5') >= 8.0} readOnly />
            )}
            <Checkbox label={`Income <= ₹5,000,000 (Current: ₹${selectedApp.annual_income || selectedApp.income || '0'})`} checked={parseInt(selectedApp.annual_income || selectedApp.income || '0') <= 500000} readOnly />

            <Title order={5} mt="md">Uploaded Documents</Title>
            {selectedApp && [
              ["Income Certificate", selectedApp.income_certificate],
                ["Mother Income Certificate", selectedApp.mother_income_certificate],
                ["Marksheet", selectedApp.Marksheet],
                ["Last Sem Result", selectedApp.last_sem_result],
                ["Bank Details", selectedApp.Bank_details],
                ["Fee Receipt", selectedApp.Fee_Receipt],
                ["Affidavit", selectedApp.Affidavit],
                ["Score Card", selectedApp.score_card],
                ["Undertaking Form", selectedApp.undertaking_form],
                ["Application Form", selectedApp.application_form],
                ["Death Certificate", selectedApp.death_certificate],
                ["Caste Certificate", selectedApp.caste_certificate],
              ["Generated PDF", selectedApp.generated_pdf]
            ].map(([label, path]) =>
              path && path !== "" && path !== null ? (
                <div key={label} style={{ marginBottom: '8px' }}>
                  <Text size="sm" weight={500}>{label}:</Text>
                  <a
                    href={`http://localhost:8000${path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#228be6', textDecoration: 'none' }}
                  >
                    View Document
                  </a>
                </div>
              ) : null
            )}

            <Title order={5} mt="md">Request Specific Documents (If any)</Title>
            <MultiSelect
              data={[
                { value: 'income_certificate', label: 'Income Certificate' },
                { value: 'last_sem_result', label: 'Last Sem Result' },
                { value: 'undertaking_form', label: 'Undertaking Form' },
                { value: 'Marksheet', label: 'Marksheet' },
                { value: 'caste_certificate', label: 'Caste Certificate' },
                { value: 'death_certificate', label: 'Death Certificate' },
                { value: 'mother_income_certificate', label: 'Mother Income Certificate' },
                { value: 'score_card', label: 'Score Card (JEE)' }
              ]}
              value={requestedDocs}
              onChange={setRequestedDocs}
              placeholder="Select missing or invalid documents"
              searchable
            />

            <Title order={5} mt="md">Internal Notes / Remarks</Title>
            <Textarea
               placeholder="Add remarks or missing info details here..."
               value={remarks} 
               onChange={(e) => setRemarks(e.currentTarget.value)} 
               minRows={3}
            />

            <Group position="right" mt="xl" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <Button color="yellow" onClick={() => handleStatusUpdate('NEEDS_INFO')}>Request Info</Button>
              <Button color="blue" onClick={() => handleStatusUpdate('UNDER_REVIEW')}>Mark Under Review</Button>
              <Button 
                color="green" 
                onClick={() => handleStatusUpdate('FORWARDED')} 
                disabled={
                  (!String(selectedApp.scholarship_type || "").includes("Single") && parseFloat(selectedApp.cpi || '8.5') < 8.0) || 
                  parseInt(selectedApp.annual_income || selectedApp.income || '0') > 500000
                }
              >
                Forward to Convener
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default AssistantApplicationsTable;