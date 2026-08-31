import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { TicketTypesService } from '../ticket-types/ticket-types.service';
import { EventsService } from '../events/events.service';
import { ChapaService } from '../payments/chapa/chapa.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventStatus } from '../events/schemas/event.schema';

const EVENT_ID = 'event-id-1';
const USER_ID = 'user-id-1';

const mockEvent = {
  _id: { toString: () => EVENT_ID },
  organizerId: { toString: () => 'organizer-id' },
  title: 'Test Event',
  status: EventStatus.PUBLISHED,
  endAt: new Date(Date.now() + 86400000),
  currency: 'ETB',
};

const mockTicketType = {
  _id: { toString: () => 'tt-id-1' },
  eventId: { toString: () => EVENT_ID },
  name: 'General Admission',
  price: 200,
  status: 'active',
  quantity: 100,
  soldQuantity: 50,
  minPerOrder: 1,
  maxPerOrder: 10,
  salesStartAt: null,
  salesEndAt: null,
};

const mockUser = { _id: USER_ID, name: 'Test User', email: 'test@example.com' };

const mockOrderModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
};

const mockSession = {
  withTransaction: jest.fn().mockImplementation((fn) => fn()),
  endSession: jest.fn(),
};

const mockConnection = {
  startSession: jest.fn().mockResolvedValue(mockSession),
};

const mockTicketTypesService = {
  findById: jest.fn().mockResolvedValue(mockTicketType),
  reserveInventory: jest.fn().mockResolvedValue(undefined),
  releaseInventory: jest.fn().mockResolvedValue(undefined),
};

const mockEventsService = {
  findById: jest.fn().mockResolvedValue(mockEvent),
};

const mockChapaService = {
  initialize: jest.fn().mockResolvedValue({
    data: { checkout_url: 'https://checkout.chapa.co/test' },
  }),
};

const mockUsersService = {
  findById: jest.fn().mockResolvedValue(mockUser),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://test-callback'),
};

const mockAuditLogsService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: mockOrderModel },
        { provide: getConnectionToken(), useValue: mockConnection },
        { provide: TicketTypesService, useValue: mockTicketTypesService },
        { provide: EventsService, useValue: mockEventsService },
        { provide: ChapaService, useValue: mockChapaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditLogsService, useValue: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
    // Restore defaults
    mockEventsService.findById.mockResolvedValue(mockEvent);
    mockTicketTypesService.findById.mockResolvedValue(mockTicketType);
    mockUsersService.findById.mockResolvedValue(mockUser);
    mockChapaService.initialize.mockResolvedValue({ data: { checkout_url: 'https://checkout.chapa.co/test' } });
    mockSession.withTransaction.mockImplementation((fn) => fn());
  });

  describe('createAndInitialize', () => {
    const dto = { eventId: EVENT_ID, items: [{ ticketTypeId: 'tt-id-1', quantity: 2 }] };

    it('throws BadRequestException for unpublished event', async () => {
      mockEventsService.findById.mockResolvedValue({ ...mockEvent, status: EventStatus.DRAFT });
      await expect(service.createAndInitialize(USER_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for ended event', async () => {
      mockEventsService.findById.mockResolvedValue({
        ...mockEvent,
        endAt: new Date(Date.now() - 1000),
      });
      await expect(service.createAndInitialize(USER_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when ticket type belongs to different event', async () => {
      mockTicketTypesService.findById.mockResolvedValue({
        ...mockTicketType,
        eventId: { toString: () => 'other-event-id' },
      });
      await expect(service.createAndInitialize(USER_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for paused ticket type', async () => {
      mockTicketTypesService.findById.mockResolvedValue({
        ...mockTicketType,
        status: 'paused',
      });
      await expect(service.createAndInitialize(USER_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when quantity exceeds maxPerOrder', async () => {
      const bigDto = { ...dto, items: [{ ticketTypeId: 'tt-id-1', quantity: 50 }] };
      await expect(service.createAndInitialize(USER_ID, bigDto)).rejects.toThrow(BadRequestException);
    });

    it('creates order, reserves inventory, initializes Chapa, fires audit log', async () => {
      const createdOrder = {
        _id: { toString: () => 'order-new-id' },
        totalAmount: 410, // 200*2 + 2.5% fee
        userId: { toString: () => USER_ID },
        items: [],
      };
      mockOrderModel.create.mockResolvedValue([createdOrder]);

      const result = await service.createAndInitialize(USER_ID, dto);

      expect(mockTicketTypesService.reserveInventory).toHaveBeenCalledWith('tt-id-1', 2, expect.anything());
      expect(mockChapaService.initialize).toHaveBeenCalled();
      expect(result.checkoutUrl).toBe('https://checkout.chapa.co/test');
      await new Promise((r) => setTimeout(r, 10));
      expect(mockAuditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'order.created' }),
      );
    });
  });

  describe('cancel', () => {
    it('throws BadRequestException for non-pending order', async () => {
      const paidOrder = {
        _id: { toString: () => 'order-1' },
        userId: { toString: () => USER_ID },
        status: 'paid',
        items: [],
      };
      mockOrderModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(paidOrder),
        }),
      });
      await expect(service.cancel('order-1', USER_ID)).rejects.toThrow(BadRequestException);
    });
  });
});
