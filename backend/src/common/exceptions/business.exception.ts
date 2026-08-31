import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    code: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ success: false, message, code }, status);
  }
}

// Predefined business exceptions
export class TicketSoldOutException extends BusinessException {
  constructor() {
    super('Ticket type is sold out', 'TICKET_SOLD_OUT', HttpStatus.CONFLICT);
  }
}

export class EventNotFoundException extends BusinessException {
  constructor() {
    super('Event not found', 'EVENT_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class TicketNotFoundException extends BusinessException {
  constructor() {
    super('Ticket not found', 'TICKET_NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedOwnerException extends BusinessException {
  constructor() {
    super(
      'You are not authorized to access this resource',
      'UNAUTHORIZED_OWNER',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class DuplicateRegistrationException extends BusinessException {
  constructor() {
    super(
      'You are already registered for this event',
      'DUPLICATE_REGISTRATION',
      HttpStatus.CONFLICT,
    );
  }
}

export class PaymentVerificationException extends BusinessException {
  constructor() {
    super(
      'Payment verification failed',
      'PAYMENT_VERIFICATION_FAILED',
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
