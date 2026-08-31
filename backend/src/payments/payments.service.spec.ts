import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Order } from '../orders/schemas/order.schema';
import { ChapaService } from './chapa/chapa.service';
import { TicketsService } from '../tickets/tickets.service';
import { ConfigService } from '@nestjs/config';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

const TX_REF = 'EVT-TEST-REF-001';

const mockOrder = {
  _id: { toString: () => 'order-id-1' },
  userId: { toString: () => 'user-id-1' },
  eventId: { title: 'Test Event', toString: () => 'event-id-1' },
  totalAmount: 500,
  currency: 'ETB',
  status: 'pending',
  items: [],
  payment: { checkoutReference: TX_REF, status: 'pending' },
};

const mockOrderModel = {
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const mockConnection = {
  startSession: jest.fn().mockResolvedValue({
    withTransaction: jest.fn().mockImplementation((fn) => fn()),
    endSession: jest.fn(),
  }),
};

const mockChapaService = {
  verify: jest.fn(),
  verifyWebhookSignature: jest.fn(),
};

const mockTicketsService = {
  generateForOrder: jest.fn().mockResolvedValue([]),
};

const mockAuditLogsService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockNotificationsService = {
  notifyPaymentSuccess: jest.fn().mockResolvedValue(undefined),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: ChapaService, useValue: mockChapaService },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  // ── verifyAndFulfill ─────────────────────────────────────────────
  describe('verifyAndFulfill', () => {
    it('throws NotFoundException when order not found', async () => {
      mockOrderModel.findOne.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });
      await expect(service.verifyAndFulfill(TX_REF, 'user-id-1'))
        .rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when wrong user', async () => {
      mockOrderModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockOrder, userId: { toString: () => 'other-user' } }),
      });
      await expect(service.verifyAndFulfill(TX_REF, 'user-id-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('returns idempotent result for already-paid order', async () => {
      mockOrderModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockOrder, status: 'paid' }),
      });
      const result = await service.verifyAndFulfill(TX_REF, 'user-id-1');
      expect(result.alreadyProcessed).toBe(true);
    });

    it('throws BadRequestException on Chapa verify failure', async () => {
      mockOrderModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockOrder }),
      });
      mockChapaService.verify.mockResolvedValue({
        data: { status: 'failed', amount: '500', reference: 'ref' },
      });
      mockOrderModel.findOne.mockReturnValueOnce({
        populate: jest.fn().mockResolvedValue({ ...mockOrder }),
      });
      // markOrderFailed uses findOneAndUpdate
      mockOrderModel.findOneAndUpdate = jest.fn().mockResolvedValue(null);
      await expect(service.verifyAndFulfill(TX_REF, 'user-id-1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  // ── handleWebhook — IDEMPOTENCY ──────────────────────────────────
  describe('handleWebhook — idempotency', () => {
    const rawBody = JSON.stringify({ tx_ref: TX_REF, status: 'success' });
    const payload = { tx_ref: TX_REF, status: 'success' } as any;

    it('ignores webhook with invalid signature', async () => {
      mockChapaService.verifyWebhookSignature.mockReturnValue(false);
      await service.handleWebhook(rawBody, 'bad-sig', payload);
      expect(mockOrderModel.findOne).not.toHaveBeenCalled();
    });

    it('skips duplicate webhook for already-paid order', async () => {
      mockChapaService.verifyWebhookSignature.mockReturnValue(true);
      mockOrderModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue({ ...mockOrder, status: 'paid' }),
      });
      await service.handleWebhook(rawBody, 'valid-sig', payload);
      // chapaService.verify should NOT be called for already-paid order
      expect(mockChapaService.verify).not.toHaveBeenCalled();
    });

    it('does NOT create duplicate tickets on duplicate webhook', async () => {
      mockChapaService.verifyWebhookSignature.mockReturnValue(true);

      // First webhook → order is pending → fulfills
      mockOrderModel.findOne
        .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue({ ...mockOrder }) })
        // Second webhook → order now paid
        .mockReturnValueOnce({ populate: jest.fn().mockResolvedValue({ ...mockOrder, status: 'paid' }) });

      mockChapaService.verify.mockResolvedValue({
        data: { status: 'success', amount: '500', reference: 'ref-1' },
      });
      mockOrderModel.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockOrder, status: 'paid', ticketsGenerated: true });

      // First call — should process
      await service.handleWebhook(rawBody, 'valid-sig', payload);
      const firstCallTicketCount = mockTicketsService.generateForOrder.mock.calls.length;

      // Second call (duplicate) — should be idempotent
      await service.handleWebhook(rawBody, 'valid-sig', payload);
      const secondCallTicketCount = mockTicketsService.generateForOrder.mock.calls.length;

      // generateForOrder must NOT be called again
      expect(secondCallTicketCount).toBe(firstCallTicketCount);
    });
  });
});
