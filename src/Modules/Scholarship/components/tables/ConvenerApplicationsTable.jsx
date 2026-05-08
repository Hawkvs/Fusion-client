import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Modal, Select, Textarea, Stack, Group, Title, Text, Grid, Paper, Timeline, Checkbox } from '@mantine/core';
import { fetchAllMcmApplications, updateScholarshipStatus } from '../../services/api';

const mockAuditLogs = [
  { date: '2026-04-10 10:00 AM', action: 'Application Submitted by Student' },
  { date: '2026-04-11 14:30 PM', action: 'Verified by SPACS Assistant' }
];

const ConvenerApplicationsTable = () => {
  const [opened, setOpened] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [applications, setApplications] = useState([]); // Empty state by default

  const loadApplications = async () => {
    try {
      const data = await fetchAllMcmApplications();
      if (Array.isArray(data)) {
        // Convener should see Forwarded, Approved, or Rejected apps
        const relevantDocs = data.filter(app => ['FORWARDED', 'APPROVED', 'REJECTED'].includes(app.status));
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
    setStatus(app.status);
    setRemarks('');
    setOpened(true);
  };

  const handleUpdateDecision = async () => {
    try {
      await updateScholarshipStatus(selectedApp.id, status, remarks, selectedApp.scholarship_type);
      alert(`Status formally updated to ${status}. Notification has been dispatched to the student and audit log recorded.`);
      loadApplications();
    } catch (error) {
      console.error("Decision update failed", error);
      alert("Failed to record decision.");
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
           <Badge color={app.status === 'APPROVED' ? 'green' : app.status === 'REJECTED' ? 'red' : app.status === 'FORWARDED' ? 'cyan' : 'yellow'}>
            {app.status || 'PENDING'}
          </Badge>
        </Table.Td>
        <Table.Td>{app.date}</Table.Td>
        <Table.Td>
          <Button size="xs" onClick={() => handleOpenDetails(app)}>Review</Button>
        </Table.Td>
      </Table.Tr>
    ))
  ) : (
    <Table.Tr>
      <Table.Td colSpan="6" style={{ textAlign: 'center', color: 'gray' }}>
        No applications forwarded for approval.
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

      <Modal opened={opened} onClose={() => setOpened(false)} title="Final Review & Decision" size="xl">
        {selectedApp && (
          <Stack spacing="md">
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Title order={5} mb="xs">Application Details</Title>
              <Grid>
                <Grid.Col span={6}><Text size="sm" weight={500}>Student ID: {selectedApp.student || selectedApp.studentId || 'N/A'}</Text></Grid.Col>
                <Grid.Col span={6}><Text size="sm" weight={500}>Scholarship: {selectedApp.scholarship_type || selectedApp.name || 'Merit Cum Means (MCM)'}</Text></Grid.Col>
                <Grid.Col span={6}><Text size="sm" weight={500}>Reported CPI: {selectedApp.cpi || 'N/A'}</Text></Grid.Col>
                <Grid.Col span={6}><Text size="sm" weight={500}>Family Income: ₹{selectedApp.annual_income || selectedApp.income || '0'}</Text></Grid.Col>
              </Grid>
              
              <Title order={5} mt="md" mb="xs">Eligibility Validation</Title>
              {!String(selectedApp.scholarship_type || "").includes("Single") && (
                <Checkbox style={{ marginBottom: '8px' }} label={`CPI >= 8.0 (Current: ${selectedApp.cpi || '8.5'})`} checked={parseFloat(selectedApp.cpi || '8.5') >= 8.0} readOnly />
              )}
              <Checkbox label={`Income <= ₹5,000,000 (Current: ₹${selectedApp.annual_income || selectedApp.income || '0'})`} checked={parseInt(selectedApp.annual_income || selectedApp.income || '0') <= 500000} readOnly />
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Title order={5} mb="xs">Verification Context</Title>
              <Text size="sm" color="dimmed"><b>Assistant Remarks:</b> {selectedApp.remarks || selectedApp.assistantRemarks || 'None'}</Text>
              
              <Title order={6} mt="md" mb="xs">Uploaded Documents</Title>
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
                    <Text size="sm" weight={500} display="inline" mr="xs">{label}:</Text>
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
            </Paper>

            <Title order={5} mt="sm">Final Decision</Title>
            <Select 
              label="Update Status" 
              data={[
                { value: 'APPROVED', label: 'Approve Application' },
                { value: 'REJECTED', label: 'Reject Application' },
                { value: 'UNDER_REVIEW', label: 'Keep Under Review' },
                { value: 'NEEDS_INFO', label: 'Request More Info' }
              ]} 
              value={status} 
              onChange={setStatus} 
              required 
            />
            <Textarea 
              label="Convener Remarks (Visible in Audit Log)" 
              placeholder="Add justification for approval/rejection to ensure policy compliance..." 
              value={remarks} 
              onChange={(e) => setRemarks(e.currentTarget.value)} 
            />

            <Title order={5} mt="sm">Audit Log</Title>
            <Timeline active={1} bulletSize={15} lineWidth={2} mt="xs">
              {mockAuditLogs.map((log, i) => (
                <Timeline.Item key={i} title={log.action}>
                  <Text color="dimmed" size="xs">{log.date}</Text>
                </Timeline.Item>
              ))}
            </Timeline>

            <Group position="right" mt="lg">
              <Button variant="outline" color="gray" onClick={() => setOpened(false)}>Cancel</Button>
              <Button color="blue" onClick={handleUpdateDecision} disabled={!status}>Submit Decision</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default ConvenerApplicationsTable;