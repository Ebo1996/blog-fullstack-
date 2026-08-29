import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth'

describe('Login Schema', () => {
  it('validates correct login data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'Password1!',
    }
    expect(() => loginSchema.parse(validData)).not.toThrow()
  })

  it('rejects invalid email', () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'Password1!',
    }
    expect(() => loginSchema.parse(invalidData)).toThrow()
  })

  it('rejects missing password', () => {
    const invalidData = {
      email: 'user@example.com',
    }
    expect(() => loginSchema.parse(invalidData)).toThrow()
  })
})

describe('Register Schema', () => {
  it('validates correct registration data', () => {
    const validData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      full_name: 'John Doe',
    }
    expect(() => registerSchema.parse(validData)).not.toThrow()
  })

  it('rejects weak password', () => {
    const invalidData = {
      email: 'user@example.com',
      password: '12345',
      full_name: 'John Doe',
    }
    expect(() => registerSchema.parse(invalidData)).toThrow()
  })

  it('rejects missing name', () => {
    const invalidData = {
      email: 'user@example.com',
      password: 'SecurePass123!',
    }
    expect(() => registerSchema.parse(invalidData)).toThrow()
  })

  it('trims whitespace from email', () => {
    const data = {
      email: '  user@example.com  ',
      password: 'SecurePass123!',
      full_name: 'John Doe',
    }
    const result = registerSchema.parse(data)
    expect(result.email).toBe('user@example.com')
  })

  it('trims whitespace from name', () => {
    const data = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      full_name: '  John Doe  ',
    }
    const result = registerSchema.parse(data)
    expect(result.full_name).toBe('John Doe')
  })
})

describe('Forgot Password Schema', () => {
  it('validates correct email', () => {
    const validData = { email: 'user@example.com' }
    expect(() => forgotPasswordSchema.parse(validData)).not.toThrow()
  })

  it('rejects invalid email', () => {
    const invalidData = { email: 'not-an-email' }
    expect(() => forgotPasswordSchema.parse(invalidData)).toThrow()
  })
})

describe('Reset Password Schema', () => {
  it('validates matching passwords', () => {
    const validData = {
      password: 'NewSecurePass123!',
      confirmPassword: 'NewSecurePass123!',
    }
    expect(() => resetPasswordSchema.parse(validData)).not.toThrow()
  })

  it('rejects non-matching passwords', () => {
    const invalidData = {
      password: 'NewSecurePass123!',
      confirmPassword: 'DifferentPass123!',
    }
    expect(() => resetPasswordSchema.parse(invalidData)).toThrow()
  })

  it('rejects weak password', () => {
    const invalidData = {
      password: 'weak',
      confirmPassword: 'weak',
    }
    expect(() => resetPasswordSchema.parse(invalidData)).toThrow()
  })

  it('requires minimum password length', () => {
    const invalidData = {
      password: 'Short1!',
      confirmPassword: 'Short1!',
    }
    expect(() => resetPasswordSchema.parse(invalidData)).toThrow()
  })
})
