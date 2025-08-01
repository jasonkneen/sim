import { NextRequest } from 'next/server'
/**
 * Integration tests for webhook trigger API route
 *
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockRequest, mockExecutionDependencies } from '@/app/api/__test-utils__/utils'

// Define mock functions at the top level to be used in mocks
const hasProcessedMessageMock = vi.fn().mockResolvedValue(false)
const markMessageAsProcessedMock = vi.fn().mockResolvedValue(true)
const closeRedisConnectionMock = vi.fn().mockResolvedValue(undefined)
const acquireLockMock = vi.fn().mockResolvedValue(true)
const generateRequestHashMock = vi.fn().mockResolvedValue('test-hash-123')
const validateSlackSignatureMock = vi.fn().mockResolvedValue(true)
const handleWhatsAppVerificationMock = vi.fn().mockResolvedValue(null)
const handleSlackChallengeMock = vi.fn().mockReturnValue(null)
const processWhatsAppDeduplicationMock = vi.fn().mockResolvedValue(null)
const processGenericDeduplicationMock = vi.fn().mockResolvedValue(null)
const fetchAndProcessAirtablePayloadsMock = vi.fn().mockResolvedValue(undefined)
const processWebhookMock = vi
  .fn()
  .mockResolvedValue(new Response('Webhook processed', { status: 200 }))
const executeMock = vi.fn().mockResolvedValue({
  success: true,
  output: { response: 'Webhook execution success' },
  logs: [],
  metadata: {
    duration: 100,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
  },
})

// Mock the DB schema objects
const webhookMock = {
  id: 'webhook-id-column',
  path: 'path-column',
  workflowId: 'workflow-id-column',
  isActive: 'is-active-column',
  provider: 'provider-column',
}
const workflowMock = { id: 'workflow-id-column' }

// Mock global timers
vi.useFakeTimers()

// Mock modules at file scope before any tests
vi.mock('@/lib/redis', () => ({
  hasProcessedMessage: hasProcessedMessageMock,
  markMessageAsProcessed: markMessageAsProcessedMock,
  closeRedisConnection: closeRedisConnectionMock,
  acquireLock: acquireLockMock,
}))

vi.mock('@/lib/webhooks/utils', () => ({
  handleWhatsAppVerification: handleWhatsAppVerificationMock,
  handleSlackChallenge: handleSlackChallengeMock,
  processWhatsAppDeduplication: processWhatsAppDeduplicationMock,
  processGenericDeduplication: processGenericDeduplicationMock,
  fetchAndProcessAirtablePayloads: fetchAndProcessAirtablePayloadsMock,
  processWebhook: processWebhookMock,
}))

vi.mock('@/app/api/webhooks/utils', () => ({
  generateRequestHash: generateRequestHashMock,
}))

vi.mock('@/app/api/webhooks/utils', () => ({
  validateSlackSignature: validateSlackSignatureMock,
}))

vi.mock('@/executor', () => ({
  Executor: vi.fn().mockImplementation(() => ({
    execute: executeMock,
  })),
}))

// Mock setTimeout and other timer functions
vi.mock('timers', () => {
  return {
    setTimeout: (callback: any) => {
      // Immediately invoke the callback
      callback()
      // Return a fake timer id
      return 123
    },
  }
})

// Mock the database and schema
vi.mock('@/db', () => {
  const dbMock = {
    select: vi.fn().mockImplementation((columns) => ({
      from: vi.fn().mockImplementation((table) => ({
        innerJoin: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              // Return empty array by default (no webhook found)
              return []
            }),
          })),
        })),
        where: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => {
            // For non-webhook queries
            return []
          }),
        })),
      })),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
  }

  return {
    db: dbMock,
    webhook: webhookMock,
    workflow: workflowMock,
  }
})

describe('Webhook Trigger API Route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.resetAllMocks()
    vi.clearAllTimers()

    mockExecutionDependencies()

    // Mock services/queue for rate limiting
    vi.doMock('@/services/queue', () => ({
      RateLimiter: vi.fn().mockImplementation(() => ({
        checkRateLimit: vi.fn().mockResolvedValue({
          allowed: true,
          remaining: 10,
          resetAt: new Date(),
        }),
      })),
      RateLimitError: class RateLimitError extends Error {
        constructor(
          message: string,
          public statusCode = 429
        ) {
          super(message)
          this.name = 'RateLimitError'
        }
      },
    }))

    vi.doMock('@/lib/workflows/db-helpers', () => ({
      loadWorkflowFromNormalizedTables: vi.fn().mockResolvedValue({
        blocks: {},
        edges: [],
        loops: {},
        parallels: {},
        isFromNormalizedTables: true,
      }),
    }))

    hasProcessedMessageMock.mockResolvedValue(false)
    markMessageAsProcessedMock.mockResolvedValue(true)
    acquireLockMock.mockResolvedValue(true)
    handleWhatsAppVerificationMock.mockResolvedValue(null)
    processGenericDeduplicationMock.mockResolvedValue(null)
    processWebhookMock.mockResolvedValue(new Response('Webhook processed', { status: 200 }))

    if ((global as any).crypto?.randomUUID) {
      vi.spyOn(crypto, 'randomUUID').mockRestore()
    }

    vi.spyOn(crypto, 'randomUUID').mockReturnValue('mock-uuid-12345')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * Test WhatsApp webhook verification challenge
   * Validates that WhatsApp protocol-specific challenge-response is handled
   */
  it('should handle WhatsApp verification challenge', async () => {
    // Set up WhatsApp challenge response
    handleWhatsAppVerificationMock.mockResolvedValue(
      new Response('challenge-123', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
    )

    // Create a search params with WhatsApp verification fields
    const verificationParams = new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'test-token',
      'hub.challenge': 'challenge-123',
    })

    // Create a mock URL with search params
    const mockUrl = `http://localhost:3000/api/webhooks/trigger/whatsapp?${verificationParams.toString()}`

    // Create a mock request with the URL using NextRequest
    const req = new NextRequest(new URL(mockUrl))

    // Mock database to return a WhatsApp webhook with matching token
    const { db } = await import('@/db')
    const whereMock = vi.fn().mockReturnValue([
      {
        id: 'webhook-id',
        provider: 'whatsapp',
        isActive: true,
        providerConfig: {
          verificationToken: 'test-token',
        },
      },
    ])

    // @ts-ignore - mocking the query chain
    db.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: whereMock,
      }),
    })

    // Mock the path param
    const params = Promise.resolve({ path: 'whatsapp' })

    // Import the handler after mocks are set up
    const { GET } = await import('@/app/api/webhooks/trigger/[path]/route')

    // Call the handler
    const response = await GET(req, { params })

    // Check response
    expect(response.status).toBe(200)

    // Should return exactly the challenge string
    const text = await response.text()
    expect(text).toBe('challenge-123')
  })

  /**
   * Test POST webhook with workflow execution
   * Verifies that a webhook trigger properly initiates workflow execution
   */
  // TODO: Fix failing test - returns 500 instead of 200
  // it('should trigger workflow execution via POST', async () => { ... })

  /**
   * Test 404 handling for non-existent webhooks
   */
  it('should handle 404 for non-existent webhooks', async () => {
    // Configure DB mock to return empty result (no webhook found)
    const { db } = await import('@/db')
    const limitMock = vi.fn().mockReturnValue([])
    const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
    const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock })
    const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock })

    // @ts-ignore - mocking the query chain
    db.select.mockReturnValue({ from: fromMock })

    // Create a mock request
    const req = createMockRequest('POST', { event: 'test' })

    // Mock the path param
    const params = Promise.resolve({ path: 'non-existent-path' })

    // Import the handler after mocks are set up
    const { POST } = await import('@/app/api/webhooks/trigger/[path]/route')

    // Call the handler
    const response = await POST(req, { params })

    // Check response - expect 404 since our implementation returns 404 when webhook is not found
    expect(response.status).toBe(404)

    // Parse the response body
    const text = await response.text()
    expect(text).toMatch(/not found/i) // Response should contain "not found" message
  })

  /**
   * Test Slack-specific webhook handling
   * Verifies that Slack signature verification is performed
   */
  // TODO: Fix failing test - returns 500 instead of 200
  // it('should handle Slack webhooks with signature verification', async () => { ... })
})
