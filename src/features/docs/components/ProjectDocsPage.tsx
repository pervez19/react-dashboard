import { useMemo, useState } from 'react';
import {
  Alert, Box, Card, CardContent, Chip, Collapse, Grid, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography,
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  ARCHITECTURE_LAYERS, OMITTED_FROM_REQUESTED_STRUCTURE, REQUEST_LIFECYCLE, docsService,
} from '../services/docsService';
import type { DocNode } from '../types/docsTypes';

const tree = docsService.getProjectTree();

/** Finds a node by its "a/b/c" path. */
function findNode(root: DocNode, path: string): DocNode | undefined {
  const [, ...rest] = path.split('/');
  return rest.reduce<DocNode | undefined>((node, name) => node?.children?.find((c) => c.name === name), root);
}

interface TreeProps {
  node: DocNode;
  path: string;
  depth: number;
  selected: string;
  expanded: ReadonlySet<string>;
  onSelect: (path: string) => void;
}

function DocTree({ node, path, depth, selected, expanded, onSelect }: TreeProps) {
  const isFolder = node.kind === 'folder';
  const isOpen = expanded.has(path);
  const folderIcon = isOpen ? <FolderOpenOutlinedIcon fontSize="small" /> : <FolderOutlinedIcon fontSize="small" />;

  return (
    <>
      <ListItemButton
        selected={selected === path}
        aria-current={selected === path ? 'true' : undefined}
        aria-expanded={isFolder ? isOpen : undefined}
        onClick={() => onSelect(path)}
        sx={{ pl: 1 + depth * 2, py: 0.25, borderRadius: 1 }}
      >
        <Box sx={{ width: 20, display: 'flex', color: 'text.secondary' }} aria-hidden>
          {isFolder && node.children?.length ? (isOpen ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />) : null}
        </Box>
        <ListItemIcon sx={{ minWidth: 30, color: isFolder ? 'primary.main' : 'text.secondary' }}>
          {isFolder ? folderIcon : <DescriptionOutlinedIcon fontSize="small" />}
        </ListItemIcon>
        <ListItemText primary={node.name} slotProps={{ primary: { variant: 'body2', fontFamily: 'monospace' } }} />
      </ListItemButton>
      {isFolder && !!node.children?.length && (
        <Collapse in={isOpen} unmountOnExit>
          <List disablePadding dense>
            {node.children.map((child) => (
              <DocTree
                key={child.name}
                node={child}
                path={`${path}/${child.name}`}
                depth={depth + 1}
                selected={selected}
                expanded={expanded}
                onSelect={onSelect}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

function DocDetails({ node, path }: { node: DocNode; path: string }) {
  return (
    <Card variant="outlined" sx={{ position: { md: 'sticky' }, top: { md: 88 } }}>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {path}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" component="h2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
              {node.name}
            </Typography>
            <Chip size="small" label={node.kind === 'folder' ? 'Folder' : 'File'} color={node.kind === 'folder' ? 'primary' : 'default'} />
          </Stack>
          <Typography>{node.summary}</Typography>
          {node.how && (
            <Box>
              <Typography variant="subtitle2" component="h3" color="primary">How it works</Typography>
              <Typography color="text.secondary">{node.how}</Typography>
            </Box>
          )}
          {node.why && (
            <Box>
              <Typography variant="subtitle2" component="h3" color="primary">Why it is built this way</Typography>
              <Typography color="text.secondary">{node.why}</Typography>
            </Box>
          )}
          {node.kind === 'folder' && !!node.children?.length && (
            <Typography variant="body2" color="text.secondary">
              Contains: {node.children.map((c) => c.name).join(', ')}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ProjectDocsPage() {
  const [selected, setSelected] = useState(`${tree.name}/src`);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set([tree.name, `${tree.name}/src`]));
  const node = useMemo(() => findNode(tree, selected) ?? tree, [selected]);

  const onSelect = (path: string) => {
    setSelected(path);
    // Clicking a folder also opens/closes it.
    if (findNode(tree, path)?.kind === 'folder') {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return next;
      });
    }
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>Project documentation</Typography>
        <Typography color="text.secondary">How this app is organised, what every file does, and why.</Typography>
      </Box>

      <Box component="section" aria-labelledby="docs-architecture">
        <Typography id="docs-architecture" variant="h6" component="h2" gutterBottom>Architecture at a glance</Typography>
        <Grid container spacing={2}>
          {ARCHITECTURE_LAYERS.map((layer) => (
            <Grid key={layer.name} size={{ xs: 12, sm: 6, lg: 'grow' }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography fontWeight={700} sx={{ fontFamily: 'monospace' }}>src/{layer.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{layer.text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box component="section" aria-labelledby="docs-lifecycle">
        <Typography id="docs-lifecycle" variant="h6" component="h2" gutterBottom>How a request flows</Typography>
        <Box component="ol" sx={{ m: 0, pl: 3, '& li': { mb: 0.75 } }}>
          {REQUEST_LIFECYCLE.map((step) => (
            <Typography key={step} component="li" color="text.secondary">{step}</Typography>
          ))}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="docs-structure">
        <Typography id="docs-structure" variant="h6" component="h2" gutterBottom>Folder structure</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a folder or file to see what it does.
        </Typography>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, md: 5 }}>
            <Card variant="outlined">
              <List dense aria-label="Project files" sx={{ maxHeight: { md: 640 }, overflow: 'auto', p: 1 }}>
                <DocTree node={tree} path={tree.name} depth={0} selected={selected} expanded={expanded} onSelect={onSelect} />
              </List>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <DocDetails node={node} path={selected} />
          </Grid>
        </Grid>
      </Box>

      <Alert severity="info">
        <Typography variant="subtitle2" component="h2">Differences from the requested structure</Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {OMITTED_FROM_REQUESTED_STRUCTURE.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Box>
      </Alert>
    </Stack>
  );
}
