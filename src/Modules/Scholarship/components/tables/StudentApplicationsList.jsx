import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Flex, Title, Modal, Text, FileInput, Stack, Box, Group } from '@mantine/core';
import ScholarshipForm from '../forms/ScholarshipForm';
import { fetchMcmApplication, fetchSingleParentApplication, withdrawApplication } from '../../services/api';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentApplicationsList = () => {
  const [opened, setOpened] = useState(false);
  const [resubmitOpened, setResubmitOpened] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [resubmitFiles, setResubmitFiles] = useState({});
  const [applications, setApplications] = useState([]); // Empty state by default
  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewApp, setPreviewApp] = useState(null);
  const [withdrawOpened, setWithdrawOpened] = useState(false);
  const [appToWithdraw, setAppToWithdraw] = useState(null);

  const confirmWithdraw = async () => {
    if (!appToWithdraw) return;
    try {
      await withdrawApplication(appToWithdraw.id, appToWithdraw.scholarship_type);
      alert('Application withdrawn successfully');
      setWithdrawOpened(false);
      setAppToWithdraw(null);
      loadApplications();
    } catch (error) {
      console.error('Withdrawal failed', error);
      alert('Failed to withdraw application.');
    }
  };


  const handlePreview = (app) => {
    setPreviewApp(app);
    setPreviewOpened(true);
  };

  const getOrderedPreviewData = (app) => {
    if (!app) return [];
    
    const allowedKeys = [
      'student_name', 'student', 'roll_no', 'email', 'batch', 'cpi', 'programme', 'address', 'category', 'scholarship_type', 'parent_status', 'status', 'annual_income'
    ];

    const entries = Object.entries(app)
      .filter(([key, value]) => allowedKeys.includes(key.toLowerCase()) && value !== null);

    return entries.sort(([keyA], [keyB]) => {
      return allowedKeys.indexOf(keyA.toLowerCase()) - allowedKeys.indexOf(keyB.toLowerCase());
    });
  };

  const handleDownloadPDF = () => {
    if (!previewApp) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${previewApp.scholarship_type || 'Scholarship'} Application Preview`, 14, 20);
    
    const tableData = getOrderedPreviewData(previewApp).map(([key, value]) => [{ content: key.replace(/_/g, ' ').toUpperCase(), styles: { fontStyle: 'bold' } }, String(value)]);

    autoTable(doc, {
      startY: 30,
      head: [['Field', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.save(`${previewApp.student || 'Student'}_Application.pdf`);
  };

  const loadApplications = async () => {
    try {
      const sp_data = await fetchSingleParentApplication().catch(() => []);
      const mcm_data = await fetchMcmApplication().catch(() => []);
      
      let combined = [];
      if (Array.isArray(mcm_data)) {
        combined = [...combined, ...mcm_data.map(item => ({...item, scholarship_type: 'Merit Cum Means (MCM)'}))];
      }
      if (Array.isArray(sp_data)) {
        combined = [...combined, ...sp_data.map(item => ({...item, scholarship_type: 'Single Parent'}))];
      }
      setApplications(combined);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleResubmit = async () => {
    try {
      const parsedData = getRemarksData(selectedApp?.remarks);
      const reqDocs = parsedData.docs || [];
      const missingDoc = reqDocs.find(doc => !resubmitFiles[doc]);

      if (reqDocs.length > 0 && missingDoc) {
        alert("Please upload all requested documents before resubmitting.");
        return;
      }

      const formData = new FormData();
      formData.append('is_resubmit', 'true');
      Object.keys(resubmitFiles).forEach(key => {
        if (resubmitFiles[key]) formData.append(key, resubmitFiles[key]);
      });
      const isSP = String(selectedApp?.name || "").includes('Single') || String(selectedApp?.scholarship_type || "").includes('Single');
      const url = isSP ? `/single_parent_update/` : `/mcm_update/`;
      const API_BASE_URL = 'http://127.0.0.1:8000/spacs';
      const token = localStorage.getItem('authToken');
      await axios.post(`${API_BASE_URL}${url}`, formData, {
        headers: { Authorization: `Token ${token}` }
      });
      alert('Documents Resubmitted Successfully!');
      setResubmitOpened(false);
      loadApplications();
    } catch (error) {
      console.error(error);
      alert('Resubmission failed.');
    }
  };

  const getRemarksData = (remarks) => {
    try {
      const parsed = JSON.parse(remarks);
      return { msg: parsed.text, docs: parsed.requested || [] };
    } catch {
      return { msg: remarks || 'Please upload the requested missing documents.', docs: [] };
    }
  };

  const handleApplicationSubmit = () => {
    loadApplications(); // Refresh list on submit
  };

  const rows = applications.length > 0 ? (
    applications.map((app, idx) => (
      <Table.Tr key={app.id || idx}>
        <Table.Td>{app.id || 'INV-' + idx}</Table.Td>
        <Table.Td>{app.student}</Table.Td>
        <Table.Td>{app.scholarship_type}</Table.Td>
        <Table.Td>{app.date ? `${new Date(app.date).getFullYear()}-${new Date(app.date).getFullYear() + 1}` : 'N/A'}</Table.Td>
        <Table.Td>
          <Badge color={app.status === 'APPROVED' ? 'green' : app.status === 'REJECTED' ? 'red' : app.status === 'NEEDS_INFO' ? 'orange' : 'yellow'}>
            {app.status || 'PENDING'}
          </Badge>
        </Table.Td>
        <Table.Td>{app.date}</Table.Td>
        <Table.Td>
          <Group spacing="xs">
            <Button size="xs" variant="light" onClick={() => handlePreview(app)}>
              Preview
            </Button>
            {app.status === 'NEEDS_INFO' && (
              <Button size="xs" color="orange" onClick={() => {
                setSelectedApp(app);
                setResubmitOpened(true);
              }}>
                Update Info
              </Button>
            )}
            {['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'INCOMPLETE', 'NEEDS_INFO', 'UNDER REVIEW'].includes(app.status?.toUpperCase() || 'INCOMPLETE') && (
              <Button size="xs" color="red" onClick={() => {
                setAppToWithdraw(app);
                setWithdrawOpened(true);
              }}>
                Withdraw
              </Button>
            )}
          </Group>
        </Table.Td>
      </Table.Tr>
    ))
  ) : (
    <Table.Tr>
      <Table.Td colSpan="7" style={{ textAlign: 'center', color: 'gray' }}>
        No applications found. Please apply for a scholarship.
      </Table.Td>
    </Table.Tr>
  );

  return (
    <div>
      <Flex justify="space-between" align="center" mb="md">
        <Title order={4}>My Applications</Title>
        <Button color="blue" onClick={() => setOpened(true)}>Apply</Button>
      </Flex>

      <Modal opened={opened} onClose={() => setOpened(false)} title="New Scholarship Application Form" size="xl">
        <ScholarshipForm onClose={() => setOpened(false)} onSubmitSuccess={handleApplicationSubmit} />
      </Modal>

      <Table highlightOnHover verticalSpacing="sm" striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Student ID</Table.Th>
            <Table.Th>Scholarship Name</Table.Th>
            <Table.Th>Academic Year</Table.Th>

            <Table.Th>Status</Table.Th>
            <Table.Th>Applied Date</Table.Th>
            <Table.Th>Action</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal opened={resubmitOpened} onClose={() => setResubmitOpened(false)} title="Update Application Info">
        <Stack>
          <Box p="sm" bg="yellow.0" style={{ borderRadius: '8px' }}>
            <Text size="sm" weight={600} color="orange.9">Remarks from Assistant:</Text>
            <Text size="sm" mt={4}>{getRemarksData(selectedApp?.remarks).msg}</Text>
          </Box>
          
          {getRemarksData(selectedApp?.remarks).docs.length > 0 ? (
            getRemarksData(selectedApp?.remarks).docs.map((doc) => {
              const docLabels = {
                income_certificate: 'Income Certificate',
                last_sem_result: 'Last Sem Result',
                undertaking_form: 'Undertaking Form',
                Marksheet: 'Marksheet',
                caste_certificate: 'Caste Certificate',
                death_certificate: 'Death Certificate',
                mother_income_certificate: 'Mother Income Certificate',
                score_card: 'Score Card (JEE)'
              };
              return (
                <FileInput 
                  key={doc} 
                  label={docLabels[doc] || doc} 
                  placeholder="Upload new" 
                  onChange={(e) => setResubmitFiles({ ...resubmitFiles, [doc]: e })} 
                />
              );
            })
          ) : (
            <>
              <FileInput label="Income Certificate" placeholder="Upload new" onChange={(e) => setResubmitFiles({ ...resubmitFiles, income_certificate: e })} />
              <FileInput label="Last Sem Result" placeholder="Upload new" onChange={(e) => setResubmitFiles({ ...resubmitFiles, last_sem_result: e })} />
              <FileInput label="Undertaking Form" placeholder="Upload new" onChange={(e) => setResubmitFiles({ ...resubmitFiles, undertaking_form: e })} />
              <FileInput label="Other general updates (Marksheet)" placeholder="Upload new" onChange={(e) => setResubmitFiles({ ...resubmitFiles, Marksheet: e })} />
            </>
          )}

          <Button onClick={handleResubmit} color="blue" mt="md">Resubmit Documents</Button>
        </Stack>
      </Modal>

      <Modal opened={previewOpened} onClose={() => setPreviewOpened(false)} title={<Title order={4}>Application Preview</Title>} size="xl" centered>
        {previewApp && (
          <Stack spacing="sm">
            <Title order={5} align="center">{previewApp.scholarship_type || 'Scholarship'} Details</Title>
            <Box style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <Table striped withBorder highlightOnHover>
                <Table.Tbody>
                  {getOrderedPreviewData(previewApp)
                    .map(([key, value]) => (
                    <Table.Tr key={key}>
                      <Table.Td w="40%" style={{textTransform: 'capitalize'}}><strong>{key.replace(/_/g, ' ')}</strong></Table.Td>
                      <Table.Td>{String(value)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
            <Group position="center" mt="md" justify="center">
              <Button color="blue" onClick={handleDownloadPDF}>Download PDF</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal opened={withdrawOpened} onClose={() => setWithdrawOpened(false)} title="Confirm Withdrawal" centered>
        <Stack spacing="md">
          <Text>Are you sure you want to withdraw this application? This action cannot be undone.</Text>
          <Group position="center" mt="md">
            <Button variant="default" onClick={() => setWithdrawOpened(false)}>Cancel</Button>
            <Button color="red" onClick={confirmWithdraw}>Confirm Withdraw</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default StudentApplicationsList;
