import { render, act } from '@testing-library/react'
import { screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { NotificationProvider, useNotification } from '../NotificationSystem'

const TestComponent = () => {
  const { showNotification } = useNotification()

  return (
    <button
      onClick={() =>
        showNotification({
          type: 'success',
          message: 'Test notification',
          priority: 'high',
          duration: 2000,
        })
      }
    >
      Show Notification
    </button>
  )
}

describe('NotificationSystem', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should show and auto-dismiss notification', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    )

    // Click button to show notification
    await userEvent.click(screen.getByText('Show Notification'))

    // Check if notification is shown
    expect(await screen.findByText('Test notification')).toBeInTheDocument()

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    // Check if notification is removed
    await waitFor(() => {
      expect(screen.queryByText('Test notification')).not.toBeInTheDocument()
    })
  })

  it('should respect priority queue', async () => {
    const TestMultipleNotifications = () => {
      const { showNotification } = useNotification()

      const showMultiple = () => {
        // Show 6 notifications (more than MAX_NOTIFICATIONS)
        for (let i = 0; i < 6; i++) {
          showNotification({
            type: 'info',
            message: `Notification ${i}`,
            priority: i < 3 ? 'high' : 'low',
            duration: 5000,
          })
        }
      }

      return <button onClick={showMultiple}>Show Multiple</button>
    }

    render(
      <NotificationProvider>
        <TestMultipleNotifications />
      </NotificationProvider>
    )

    // Click button to show notifications
    await userEvent.click(screen.getByText('Show Multiple'))

    // Wait for notifications to be processed
    await waitFor(() => {
      // Should show high priority notifications
      expect(screen.getByText('Notification 0')).toBeInTheDocument()
      expect(screen.getByText('Notification 1')).toBeInTheDocument()
      expect(screen.getByText('Notification 2')).toBeInTheDocument()

      // Should not show all low priority notifications
      expect(screen.queryByText('Notification 5')).not.toBeInTheDocument()
    })
  })

  it('should handle notification actions', async () => {
    const actionHandler = jest.fn()

    const TestActionNotification = () => {
      const { showNotification } = useNotification()

      const showWithAction = () => {
        showNotification({
          type: 'info',
          message: 'Action notification',
          priority: 'high',
          action: {
            label: 'Click me',
            onClick: actionHandler,
          },
        })
      }

      return <button onClick={showWithAction}>Show Action Notification</button>
    }

    render(
      <NotificationProvider>
        <TestActionNotification />
      </NotificationProvider>
    )

    // Show notification with action
    await userEvent.click(screen.getByText('Show Action Notification'))

    // Click action button
    const actionButton = await screen.findByText('Click me')
    await userEvent.click(actionButton)

    // Check if action handler was called
    expect(actionHandler).toHaveBeenCalled()
  })
})
