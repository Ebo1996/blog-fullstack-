# Fix for "Failed to create order" Error

## Problem Summary

Users were unable to purchase tickets and received the error message:
**"Failed to create order. Please try again."**

## Root Cause Analysis

After investigation, we discovered **TWO critical issues**:

### Issue 1: Collection Name Mismatch
- The Mongoose schema was configured to use collection name `ticketTypes` (camelCase)
- The actual MongoDB data was stored in collection `tickettypes` (lowercase)
- This caused the API endpoint `/events/:eventId/ticket-types` to return 0 tickets
- Result: Frontend showed no available tickets, making purchase impossible

### Issue 2: Virtual Field Not Serialized
- The `availableQuantity` field is defined as a Mongoose virtual field
- Virtual fields are computed properties (quantity - soldQuantity)
- Even though the schema had `toJSON: { virtuals: true }` settings, the field wasn't being included
- Result: Frontend couldn't determine ticket availability

## Fix Applied

### File: `backend/src/ticket-types/schemas/ticket-type.schema.ts`

**Change 1: Fixed collection name**
```typescript
// Before:
@Schema({ timestamps: true, collection: 'ticketTypes' })

// After:
@Schema({ timestamps: true, collection: 'tickettypes' })
```

**Change 2: Ensured virtual fields are serialized** (already present, but confirmed)
```typescript
TicketTypeSchema.set('toJSON', { virtuals: true });
TicketTypeSchema.set('toObject', { virtuals: true });
```

## How to Apply the Fix

1. **Stop the backend server** (if running)
   ```bash
   # Press Ctrl+C in the terminal where backend is running
   ```

2. **Rebuild the backend**
   ```bash
   cd backend
   npm run build
   ```

3. **Restart the backend server**
   ```bash
   npm run start:dev
   # OR for production:
   npm run start:prod
   ```

4. **Verify the fix**
   ```bash
   node scripts/test-api-call.js
   ```
   
   Expected output:
   - Ticket types should be returned by the API
   - Each ticket should have `availableQuantity` field with a numeric value

## Testing Checklist

- [ ] Backend server restarted with new build
- [ ] API endpoint `/events/:eventId/ticket-types` returns tickets
- [ ] Each ticket has `availableQuantity` field defined
- [ ] Frontend displays tickets on event page
- [ ] Users can select ticket quantities
- [ ] Order creation works successfully
- [ ] Chapa checkout redirection works

## Technical Details

### Database Schema
- Collection: `tickettypes` (lowercase)
- Fields:
  - `eventId`: ObjectId (reference to Event)
  - `name`: String
  - `price`: Number
  - `quantity`: Number (total available)
  - `soldQuantity`: Number (number sold, default: 0)
  - `status`: Enum ['active', 'paused', 'sold_out', 'expired']
  - `availableQuantity`: Virtual field = quantity - soldQuantity

### API Endpoints
- `GET /api/events/:eventId/ticket-types` - List ticket types (PUBLIC)
- `POST /api/orders` - Create order (AUTHENTICATED)

### Order Creation Flow
1. User selects tickets on event page
2. Frontend calls `POST /api/orders` with:
   ```json
   {
     "eventId": "...",
     "items": [
       { "ticketTypeId": "...", "quantity": 1 }
     ]
   }
   ```
3. Backend validates:
   - Event is published
   - Ticket types exist and are active
   - Inventory is available (availableQuantity > 0)
   - Quantities are within min/max limits
4. Backend creates order and initializes Chapa payment
5. User is redirected to Chapa checkout

## Diagnostic Scripts

Created for troubleshooting:
- `backend/scripts/test-order-api.js` - Check MongoDB data directly
- `backend/scripts/test-api-call.js` - Test API endpoints
- `backend/scripts/fix-ticket-soldquantity.js` - Fix missing soldQuantity values

## Prevention

To prevent this issue in the future:
1. Always use lowercase collection names in schemas
2. Verify virtual fields are included in serialization
3. Test API endpoints return expected fields
4. Add integration tests for order creation flow

## Related Files Modified

- `backend/src/ticket-types/schemas/ticket-type.schema.ts` - Fixed collection name
- Created diagnostic scripts in `backend/scripts/`

---

**Date**: September 1, 2026
**Status**: Fix applied, awaiting backend restart for verification
