import { Test, TestingModule } from '@nestjs/testing';
import { CheckInsService } from './check-ins.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { CheckIn } from './schemas/check-in.schema';
import { TicketsService } from '../tickets/tickets.service';
import { EventsService } from '../events/events.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { TicketStatus } from '../tickets/schemas/ticket.schema';

const mockTicket = {
  _id: { toString: () => 'ticket-id-1' },
  eventId: { toString: () => 'event-id-1' },
  ownerId: { toString: () => 'user-id-1' },
  ticketTypeId: 'tickettype-id-1',
  ticketCode: 'EVT-001',
  qrToken: 'secure-uuid-token',
  status: TicketStatus.ACTIVE,
  checkedInAt: null,
  isTransferPending: false,
};

const mockEvent = { _id: { toString: () => 'event-id-1' } };

const mockCheckInModel = {
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn().mockResolvedValue({}),
  findOneAndUpdate: jest.fn(),
};

const mockSession = {
  withTransaction: jest.fn().mockImplementation((fn) => fn()),
  endSession: jest.fn(),
};

const mockConnection = {
  startSession: jest.fn().mockResolvedValue(mockSession),
};

const mockTicketsService = {
  findByToken: jest.fn(),
  findById: jest.fn(),
  ticketModel: {
    findOneAndUpdate: jest.fn(),
  },
};

const mockEventsService = {
  findById: jest.fn().mockResolvedValue(mockEvent),
};

const mockAuditLogsService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('CheckInsService', () => {
  let service: CheckInsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckInsService,
        { provide: getModelToken(CheckIn.name), useValue: mockCheckInModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: EventsService, useValue: mockEventsService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<CheckInsService>(CheckInsService);
    jest.clearAllMocks();
    // Restore default mock after clear
    mockEventsService.findById.mockResolvedValue(mockEvent);
    mockSession.withTransaction.mockImplementation((fn) => fn());
  });

  describe('scan', () => {
    it('returns invalid for unknown token', async () => {
      mockTicketsService.findByToken.mockResolvedValue(null);
      const result = await service.scan('bad-token', 'event-id-1', 'staff-id');
      expect(result.result).toBe('invalid');
    });

    it('returns wrong_event when ticket belongs to different event', async () => {
      mockTicketsService.findByToken.mockResolvedValue({
        ...mockTicket,
        eventId: { toString: () => 'different-event-id' },
      });
      const result = await service.scan('secure-uuid-token', 'event-id-1', 'staff-id');
      expect(result.result).toBe('wrong_event');
    });

    it('returns already_used for used ticket', async () => {
      mockTicketsService.findByToken.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.USED,
        checkedInAt: new Date(),
      });
      const result = await service.scan('secure-uuid-token', 'event-id-1', 'staff-id');
      expect(result.result).toBe('already_used');
    });

    it('returns invalid for cancelled ticket', async () => {
      mockTicketsService.findByToken.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.CANCELLED,
      });
      const result = await service.scan('secure-uuid-token', 'event-id-1', 'staff-id');
      expect(result.result).toBe('invalid');
    });

    it('returns success and fires audit log for active ticket', async () => {
      mockTicketsService.findByToken.mockResolvedValue({ ...mockTicket });
      mockTicketsService.ticketModel.findOneAndUpdate.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.USED,
      });
      mockCheckInModel.create.mockResolvedValue({});

      const result = await service.scan('secure-uuid-token', 'event-id-1', 'staff-id');
      expect(result.result).toBe('success');
      await new Promise((r) => setTimeout(r, 10));
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ticket.checked_in' }),
      );
    });

    it('handles race condition when ticket updated by another scanner simultaneously', async () => {
      mockTicketsService.findByToken.mockResolvedValue({ ...mockTicket });
      // Simulate race: findOneAndUpdate returns null (another scanner won)
      mockTicketsService.ticketModel.findOneAndUpdate.mockResolvedValue(null);
      mockSession.withTransaction.mockImplementation(async (fn) => {
        await fn();
      });
      // ConflictException thrown inside transaction — withTransaction will throw
      mockSession.withTransaction.mockImplementation(() => {
        throw new Error('Ticket was already used (race condition)');
      });

      await expect(service.scan('secure-uuid-token', 'event-id-1', 'staff-id'))
        .rejects.toThrow();
    });
  });
});
