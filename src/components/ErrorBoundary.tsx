import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logError } from '../lib/log'

/* Shows a plain sentence and a way back instead of a white screen. */

type State = { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logError(error, { componentStack: info.componentStack })
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children
    return (
      <main className="wrap" role="alert">
        <div className="card">
          <h1 className="h2">Something went wrong</h1>
          <p className="muted">The page hit an unexpected error. Your records are safe.</p>
          <button type="button" className="btn" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      </main>
    )
  }
}
