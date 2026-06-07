import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { reportClientError } from '@/lib/client-error-reporting'

interface Props {
  children: ReactNode
  title?: string
}

interface State {
  hasError: boolean
}

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportClientError(error, {
      boundary: 'ClientErrorBoundary',
      componentStack: info.componentStack ?? undefined,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <h2 className="text-lg font-semibold">{this.props.title ?? 'Something went wrong'}</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            The page failed to render. Try refreshing or go back to the homepage.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </Button>
            <Button
              type="button"
              asChild
            >
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
