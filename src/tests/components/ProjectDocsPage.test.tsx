import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectDocsPage from '../../features/docs/components/ProjectDocsPage';
import { docsService } from '../../features/docs/services/docsService';
import type { DocNode } from '../../features/docs/types/docsTypes';

const ROOT = path.resolve(__dirname, '../../..');

/** Paths (relative to the project root) of every documented file. */
function documentedFiles(node: DocNode, prefix = ''): string[] {
  return (node.children ?? []).flatMap((child) => {
    const rel = prefix ? `${prefix}/${child.name}` : child.name;
    return child.kind === 'file' ? [rel] : documentedFiles(child, rel);
  });
}

function filesOnDisk(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return filesOnDisk(rel);
    return entry.name === '.gitkeep' ? [] : [rel];
  });
}

describe('ProjectDocsPage', () => {
  it('lets you browse the tree and read what a file does', async () => {
    render(<ProjectDocsPage />);
    expect(screen.getByRole('heading', { name: 'Project documentation' })).toBeInTheDocument();
    expect(screen.getByText('All application source code.')).toBeInTheDocument(); // src selected by default

    // Text queries: role queries over a large MUI tree are very slow in jsdom.
    await userEvent.click(screen.getByText('core'));
    await userEvent.click(screen.getByText('services'));
    await userEvent.click(screen.getByText('authService.ts'));

    const treeItem = screen.getAllByText('authService.ts')[0]!.closest('[aria-current]');
    expect(treeItem).toHaveAttribute('aria-current', 'true');
    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText(/Talks to the authentication API/)).toBeInTheDocument();
  });

  describe('stays in sync with the code', () => {
    const documented = documentedFiles(docsService.getProjectTree());

    it('documents only files that exist', () => {
      expect(documented.filter((f) => !fs.existsSync(path.join(ROOT, f)))).toEqual([]);
    });

    it('documents every file in src, public and assets', () => {
      const onDisk = ['src', 'public', 'assets'].flatMap(filesOnDisk);
      expect(onDisk.filter((f) => !documented.includes(f))).toEqual([]);
    });
  });
});
