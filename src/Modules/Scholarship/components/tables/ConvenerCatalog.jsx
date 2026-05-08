import React, { useState, useEffect } from 'react';
import { fetchFrontendCatalog, updateFrontendCatalog } from '../../services/api';
import { Table, Button, Badge, Group, Modal, TextInput, Select, NumberInput, Stack, Textarea } from '@mantine/core';

const ConvenerCatalog = () => {
  const [catalog, setCatalog] = useState([]);
  const [opened, setOpened] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchFrontendCatalog().then(data => {
      if (Array.isArray(data)) setCatalog(data);
    }).catch(err => console.error(err));
  }, []);

  const handleOpenForm = (item = null) => {
    if (item) {
      setFormData(item);
      setEditMode(true);
    } else {
      setFormData({});
      setEditMode(false);
    }
    setOpened(true);
  };

  const handleSave = async () => {
    let newCatalog;
    if (editMode) {
      newCatalog = catalog.map(item => item.id === formData.id ? formData : item);
    } else {
      const newItem = { ...formData, id: Date.now() }; // Mock ID for new item
      newCatalog = [...catalog, newItem];
    }
    setCatalog(newCatalog);
    await updateFrontendCatalog(newCatalog);
    setOpened(false);
  };

  const handleDelete = async (id) => {
    const newCatalog = catalog.filter(item => item.id !== id);
    setCatalog(newCatalog);
    await updateFrontendCatalog(newCatalog);
  };

  const rows = catalog.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td>{item.name}</Table.Td>
      <Table.Td>{item.description}</Table.Td>
      <Table.Td>{item.min_cpi}</Table.Td>
      <Table.Td>{item.max_backlogs}</Table.Td>
      <Table.Td>{item.department || 'Any'}</Table.Td>
      <Table.Td>{item.deadline}</Table.Td>
      <Table.Td>
        <Group spacing="xs">
          <Button size="xs" variant="outline" onClick={() => handleOpenForm(item)}>Edit</Button>
          <Button size="xs" color="red" variant="outline" onClick={() => handleDelete(item.id)}>Delete</Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <div>

      <Table highlightOnHover verticalSpacing="sm" striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Min CPI</Table.Th>
            <Table.Th>Max Backlogs</Table.Th>
            <Table.Th>Department</Table.Th>
            <Table.Th>Deadline</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={() => setOpened(false)} title={editMode ? "Edit Award" : "Create Award"}>
        <Stack spacing="md">
          <TextInput label="Award Name" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <Textarea label="Description" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          <NumberInput label="Minimum CPI" value={formData.min_cpi || ''} onChange={(val) => setFormData({...formData, min_cpi: val})} precision={2} />
          <NumberInput label="Maximum Backlogs" value={formData.max_backlogs || ''} onChange={(val) => setFormData({...formData, max_backlogs: val})} />
          <TextInput label="Department (Optional)" value={formData.department || ''} onChange={(e) => setFormData({...formData, department: e.target.value})} />
          <TextInput label="Required Documents" value={formData.required_docs || ''} onChange={(e) => setFormData({...formData, required_docs: e.target.value})} />
          <TextInput type="date" label="Application Deadline" value={formData.deadline || ''} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
          <TextInput type="date" label="Announcement Date" value={formData.announcement_date || ''} onChange={(e) => setFormData({...formData, announcement_date: e.target.value})} />
          <Button color="blue" onClick={handleSave}>Save Changes</Button>
        </Stack>
      </Modal>
    </div>
  );
};

export default ConvenerCatalog;
