import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Transfer } from './schemas/transfer.schema';
import { TicketsService } from '../tickets/tickets.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ForbiddenException, BadRequestException, ConflictException, NotFoundException,
} from '@nestjs/common';
import { TicketStatus } from '../tickets/schemas/ticket.schema';

const SENDER_ID = 'sender-user-id';
const RECIPIENT_ID = 'recipient-user-id';
const TICKET_ID = 'ticket-id-1';

const mockTicket = {
  _id: { toString: () => TICKET_ID },
  ownerId: { toString: () => SENDER_ID },
  status: TicketStatus.ACTIVE,
  isTransferPending: false,
};

const mockSender = { _id: SENDER_ID, email: 'sender@example.com', name: 'Sender' };
const mockRecipient = { _id: RECIPIENT_ID, email: 'recipient@example.com', name: 'Recipient' };

const mockTransfer = {
  _id: { toString: () => 'transfer-id-1' },
  ticketId: { toString: () => TICKET_ID },
  fromUserId: { toString: () => SENDER_ID },
  toUserId: { toString: () => RECIPIENT_ID },
  toEmail: 'recipient@example.com',
  status: 'pending',
  expiresAt: new Date(Date.now() + 86400000),
};

const mockTransferModel = {
  create: jest.fn().mockResolvedValue(mockTransfer),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const mockSession = {
  withTransaction: jest.fn().mockImplementation((fn) => fn()),
  endSession: jest.fn(),
};

const mockConnection = {
  startSession: jest.fn().mockResolvedValue(mockSession),
};

const mockTicketsService = {
  findById: jest.fn().mockResolvedValue(mockTicket),
  setTransferPending: jest.fn().mockResolvedValue(undefined),
  markTransferred: jest.fn().mockResolvedValue(undefined),
};

const mockUsersService = {
  findById: jest.fn().mockResolvedValue(mockSender),
  findByEmail: jest.fn().mockResolvedValue(mockRecipient),
};

const mockNotificationsService = {
  notifyTransferReceived: jest.fn().mockResolvedValue(undefined),
  create: jest.fn().mockResolvedValue(undefined),
};

describe('TransfersService', () => {
  let service: TransfersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        { provide: getModelToken(Transfer.name), useValue: mockTransferModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: TicketsService, useValue: mockTicketsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
    jest.clearAllMocks();
    // Restore defaults
    mockTicketsService.findById.mockResolvedValue(mockTicket);
    mockUsersService.findById.mockResolvedValue(mockSender);
    mockUsersService.findByEmail.mockResolvedValue(mockRecipient);
    mockTransferModel.findOne.mockResolvedValue(null);
  });

  describe('initiate', () => {
    const dto = { ticketId: TICKET_ID, recipientEmail: 'recipient@example.com' };

    it('throws ForbiddenException when sender does not own ticket', async () => {
      mockTicketsService.findById.mockResolvedValue({
        ...mockTicket,
        ownerId: { toString: () => 'other-user' },
      });
      await expect(service.initiate(SENDER_ID, dto)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for non-active ticket', async () => {
      mockTicketsService.findById.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.USED,
      });
      await expect(service.initiate(SENDER_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when transferring to yourself', async () => {
      mockUsersService.findById.mockResolvedValue({ ...mockSender, email: 'recipient@example.com' });
      await expect(service.initiate(SENDER_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when recipient not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.initiate(SENDER_ID, dto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException for already-pending transfer', async () => {
      mockTransferModel.findOne.mockResolvedValue(mockTransfer);
      await expect(service.initiate(SENDER_ID, dto)).rejects.toThrow(ConflictException);
    });

    it('creates transfer and notifies recipient', async () => {
      mockTransferModel.create.mockResolvedValue(mockTransfer);
      const result = await service.initiate(SENDER_ID, dto);
      expect(result).toBe(mockTransfer);
      expect(mockTicketsService.setTransferPending).toHaveBeenCalledWith(TICKET_ID, true);
      await new Promise((r) => setTimeout(r, 10));
      expect(mockNotificationsService.notifyTransferReceived).toHaveBeenCalled();
    });
  });

  describe('accept', () => {
    it('throws NotFoundException for unknown transfer', async () => {
      mockTransferModel.findById.mockResolvedValue(null);
      await expect(service.accept('bad-id', RECIPIENT_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when non-recipient tries to accept', async () => {
      mockTransferModel.findById.mockResolvedValue(mockTransfer);
      await expect(service.accept('transfer-id-1', 'wrong-user')).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException for expired transfer', async () => {
      mockTransferModel.findById.mockResolvedValue({
        ...mockTransfer,
        expiresAt: new Date(Date.now() - 1000),
      });
      mockTransferModel.findByIdAndUpdate.mockResolvedValue({ ...mockTransfer, status: 'expired' });
      await expect(service.accept('transfer-id-1', RECIPIENT_ID)).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('rejects and releases transfer-pending flag', async () => {
      mockTransferModel.findById.mockResolvedValue(mockTransfer);
      mockTransferModel.findByIdAndUpdate.mockResolvedValue({ ...mockTransfer, status: 'rejected' });
      await service.reject('transfer-id-1', RECIPIENT_ID);
      expect(mockTicketsService.setTransferPending).toHaveBeenCalledWith(TICKET_ID, false);
    });
  });
});
