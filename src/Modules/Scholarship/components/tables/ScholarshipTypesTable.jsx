import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Container, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { fetchFrontendCatalog } from '../../services/api';

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toText = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

const normalizeDocuments = (award) => {
  const raw =
    award.required_documents ||
    award.required_docs ||
    award.required_doc ||
    award.documents ||
    award.document_list ||
    award.catalog_documents;

  if (Array.isArray(raw)) {
    return raw.filter(Boolean);
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const fallback = toText(award.catalog || award.description)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  return fallback.length > 0 ? fallback.slice(0, 4) : [];
};

const getDeadline = (award) => award.deadline || award.application_deadline || award.enddate || award.end_date || '';

const isAwardOpen = (award) => {
  const deadline = parseDate(getDeadline(award));
  if (!deadline) return true;
  deadline.setHours(23, 59, 59, 999);
  return deadline.getTime() >= Date.now();
};

const formatCriteria = (award) => {
  const parts = [];
  if (award.min_cpi !== undefined && award.min_cpi !== null && award.min_cpi !== '') {
    parts.push(`Minimum CPI: ${award.min_cpi}`);
  }
  if (award.max_backlogs !== undefined && award.max_backlogs !== null && award.max_backlogs !== '') {
    parts.push(`Maximum Backlogs: ${award.max_backlogs}`);
  }
  if (award.department) {
    parts.push(`Department: ${award.department}`);
  }

  if (parts.length > 0) {
    return parts;
  }

  const eligibility = toText(award.eligibility || award.catalog_eligibility || award.criteria);
  return eligibility ? [eligibility] : ['Eligibility not specified yet'];
};

const ScholarshipTypesTable = () => {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadCatalog = async () => {
      try {
        const data = await fetchFrontendCatalog();
        if (!mounted) return;

        const items = Array.isArray(data) ? data : [];
        setCatalog(items);
        setError('');
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading awards catalog:', err);
        setError('Unable to load awards right now. Please refresh the page.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const activeAwards = useMemo(
    () => catalog.filter((award) => isAwardOpen(award)),
    [catalog],
  );

  const closedCount = Math.max(catalog.length - activeAwards.length, 0);

  return (
    <Container size="xl" px={{ base: 'xs', sm: 'sm', md: 'md' }} py={{ base: 'sm', md: 'md' }}>
      <Stack gap="md">
        <div>
          <Title order={3}>Available Awards</Title>
          <Text size="sm" c="dimmed" mt={4}>
            Browse currently open awards. Expired awards are hidden automatically.
          </Text>
        </div>

        {loading && (
          <Group justify="center" py="xl">
            <Loader size="lg" />
          </Group>
        )}

        {!loading && error && (
          <Alert color="red" title="Awards unavailable">
            {error}
          </Alert>
        )}

        {!loading && !error && activeAwards.length === 0 && (
          <Alert color="yellow" title="No open awards">
            There are no awards open for application at the moment.
            {closedCount > 0 ? ` ${closedCount} closed award(s) are hidden.` : ''}
          </Alert>
        )}

        {!loading && !error && activeAwards.length > 0 && (
          <Grid gutter="md">
            {activeAwards.map((award) => {
              const deadline = getDeadline(award);
              const documents = normalizeDocuments(award);
              const criteria = formatCriteria(award);
              const title = award.award_name || award.name || 'Award';
              const description = award.description || award.catalog || 'Description not available yet.';
              const announcementDate = award.announcement_date || award.announcementDate || '';

              return (
                <Grid.Col key={award.id || title} span={{ base: 12, md: 6, xl: 4 }}>
                  <Card withBorder radius="lg" shadow="sm" h="100%">
                    <Stack gap="sm">
                      <Group justify="space-between" align="flex-start">
                        <div>
                          <Title order={4}>{title}</Title>
                          <Text size="sm" c="dimmed" mt={4}>
                            {description}
                          </Text>
                        </div>
                        <Badge color="green" variant="light">
                          Open
                        </Badge>
                      </Group>

                      <div>
                        <Text fw={600} size="sm" mb={6}>Eligibility Criteria</Text>
                        <Stack gap={4}>
                          {criteria.map((item) => (
                            <Text key={item} size="sm">
                              {item}
                            </Text>
                          ))}
                        </Stack>
                      </div>

                      <div>
                        <Text fw={600} size="sm" mb={6}>Required Documents</Text>
                        {documents.length > 0 ? (
                          <Group gap="xs">
                            {documents.map((doc) => (
                              <Badge key={doc} variant="outline" color="blue">
                                {doc}
                              </Badge>
                            ))}
                          </Group>
                        ) : (
                          <Text size="sm" c="dimmed">No documents listed yet.</Text>
                        )}
                      </div>

                      <Group justify="space-between" align="flex-end">
                        <div>
                          <Text size="sm" fw={600}>Application Deadline</Text>
                          <Text size="sm">{deadline || 'Not set'}</Text>
                        </div>
                        {announcementDate && (
                          <div style={{ textAlign: 'right' }}>
                            <Text size="sm" fw={600}>Announcement Date</Text>
                            <Text size="sm">{announcementDate}</Text>
                          </div>
                        )}
                      </Group>

                      <Button variant="light" disabled fullWidth>
                        Apply from Applications tab
                      </Button>
                    </Stack>
                  </Card>
                </Grid.Col>
              );
            })}
          </Grid>
        )}

        {!loading && closedCount > 0 && (
          <Text size="sm" c="dimmed">
            {closedCount} expired award(s) were hidden because their deadline has passed.
          </Text>
        )}
      </Stack>
    </Container>
  );
};

export default ScholarshipTypesTable;
