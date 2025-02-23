import React, { Component, createRef } from 'react';
import styled from 'styled-components';

const StyledSpinner = styled.svg`

  transform-origin: center;
  animation: spin .75s infinite linear;

  @keyframes spin {
    100% { transform: rotate(360deg); }
  }
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
`;

const IframeWrapper = styled.iframe`
  width: 100%;
  height: 100vh;
  border: none;
  display: block;
`;

interface BuilderProps {
  initialFiles: Record<string, string>;
  onResize?: (height: number) => void;
}

interface BuilderState {
  isLoading: boolean;
}

export default class Builder extends Component<BuilderProps, BuilderState> {
  private buildWorkerRef: Worker | null = null;
  private iframeRef = createRef<HTMLIFrameElement>();
  private buildStarted = false;
  private resizeObserver: ResizeObserver | null = null;

  state = {
    isLoading: false
  };

  componentDidMount() {
    if (!this.buildStarted) {
      this.buildStarted = true;
      this.renderGeneratedApp(this.props.initialFiles);
    }

    window.addEventListener('message', this.handleIframeMessage);
  }

  componentWillUnmount() {
    if (this.buildWorkerRef) {
      this.buildWorkerRef.terminate();
    }
    window.removeEventListener('message', this.handleIframeMessage);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private handleIframeMessage = (event: MessageEvent) => {
    if (event.data.type === 'resize') {
      const height = event.data.height;
      if (this.iframeRef.current) {
        // this.iframeRef.current.style.height = `${height}px`;
      }
      this.props.onResize?.(height);
    }
  };

  private initWorker = async () => {
    if (!this.buildWorkerRef) {
      const response = await fetch('/client/Builder/esbuild-worker.js');
      const workerContent = await response.text();
      const blob = new Blob([workerContent], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.buildWorkerRef = new Worker(workerUrl);
    }
    return this.buildWorkerRef;
  };

  private adjustIframeHeight = () => {
    const iframe = this.iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        const sendHeight = () => {
          const body = iframe.contentWindow?.document.body;
          const html = iframe.contentWindow?.document.documentElement;
          if (body && html) {
            const height = Math.max(
              body.scrollHeight,
              body.offsetHeight,
              html.clientHeight,
              html.scrollHeight,
              html.offsetHeight
            );
            iframe.style.height = `${height}px`;
            this.props.onResize?.(height);
          }
        };

        if (this.resizeObserver) {
          this.resizeObserver.disconnect();
        }

        this.resizeObserver = new ResizeObserver(sendHeight);
        this.resizeObserver.observe(iframe.contentWindow.document.body);
        sendHeight();
      } catch (error) {
        console.error('Could not adjust iframe height:', error);
      }
    }
  };

  private renderGeneratedApp = async (fileContents: Record<string, string>) => {
    this.setState({ isLoading: true });
    console.log('Rendering generated app with files:', fileContents);
    const worker = await this.initWorker();

    try {
      const result = await new Promise<string>((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.type === 'success') {
            resolve(e.data.output);
          } else if (e.data.type === 'error') {
            reject(e.data.error);
          }
        };

        worker.postMessage({
          type: 'build',
          fileContents
        });
      });

      console.log('fileContents', fileContents);

      const parsedResult = JSON.parse(result);

      const htmlWrapper = await fetch('/client/Builder/index.html').then(res => res.text());

      let newAppHtml = htmlWrapper.split('/* [[APP_CODE]] */').join(parsedResult.js);
      const newCss = parsedResult.css ? `<style>${parsedResult.css}</style>` : '';
      newAppHtml = newAppHtml.split('/* [[APP_CSS]] */').join(newCss);

      const appHtmlBlob = new Blob([newAppHtml], { type: 'text/html' });
      const appHtmlUrl = URL.createObjectURL(appHtmlBlob);

      if (this.iframeRef.current) {
        // wipe iframe clean first
        this.iframeRef.current.contentWindow?.document.open();
        this.iframeRef.current.contentWindow?.document.write('');
        this.iframeRef.current.contentWindow?.document.close();

        this.iframeRef.current.src = appHtmlUrl;
        this.iframeRef.current.onload = () => {
          URL.revokeObjectURL(appHtmlUrl);
          
          const iframe = this.iframeRef.current;
          if (iframe) {
            // iframe.contentWindow?.addEventListener('resize', this.adjustIframeHeight);
            // this.adjustIframeHeight();
          }
        };
      }

      worker.postMessage({ type: 'terminate' });
      worker.terminate();
      this.buildWorkerRef = null;

    } catch (error) {
      console.error('Build failed:', error);
    } finally {
      this.setState({ isLoading: false });
    }
  };

  render() {
    return (
      <Container>
        {this.state.isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px'
          }}>
            <StyledSpinner width="100px" height="100px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" fill="#3498db"/>
              <path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z" fill="#566d91"/>
            </StyledSpinner>
          </div>
        )}
        <IframeWrapper ref={this.iframeRef} />
      </Container>
    );
  }
}