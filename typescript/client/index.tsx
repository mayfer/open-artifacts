import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Builder from './Builder';
import styled from 'styled-components';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

const widgetFiles: Record<string, string> = {};
const sampleDir = '/client/sample_apps/cubes';
const files = [
    '/index.tsx',
    '/App.tsx'
];

// Fetch and populate widget files
await Promise.all(files.map(async (file) => {
  const response = await fetch(`${sampleDir}/${file}`);
  const content = await response.text();
  widgetFiles[file] = content;
}));

const Layout = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px;
  height: calc(100vh - 100px); // Account for header
`;

const LeftColumn = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 10px;
  min-height: 500px;
`;

const RightColumn = styled.div`
  flex: 2;
  min-width: 0;
`;

const BuilderContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 10px;
  overflow: hidden;
  min-height: 500px;
  position: relative;
  height: 100%;
`;

const Main = styled.div`
  font-family: monospace;
`;

const FileContent = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-height: 400px;
  overflow-y: auto;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
  }
`;

const FileTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
`;

function Clock() {
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  const [height, setHeight] = useState('auto');

  return (
    <Main>
      <h1>Browser-side Typescript & TSX</h1>
      <Layout>
        <LeftColumn>
          {Object.entries(widgetFiles).map(([filename, content]) => (
            <FileContent key={filename}>
              <FileTitle>{filename}</FileTitle>
              <pre>
            <code className="language-tsx">
              {content}
            </code>
          </pre>
            </FileContent>
          ))}
        </LeftColumn>
        <RightColumn>
          <BuilderContainer>
            <Builder 
              initialFiles={widgetFiles} 
              onResize={(height) => setHeight(`${height}px`)} 
            />
          </BuilderContainer>
        </RightColumn>
      </Layout>
    </Main>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Clock />);