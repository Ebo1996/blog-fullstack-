#!/usr/bin/env ts-node
/**
 * Security Check Script
 * Scans codebase for common security issues
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

interface SecurityIssue {
  file: string
  line: number
  severity: 'high' | 'medium' | 'low'
  issue: string
  code: string
}

const issues: SecurityIssue[] = []

// Patterns to check
const SECURITY_PATTERNS = [
  {
    pattern: /process\.env\.(SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)/g,
    severity: 'high' as const,
    message: 'Exposed secret key - ensure this is server-side only',
    exclude: ['/lib/supabase/service.ts', '/api/'],
  },
  {
    pattern: /eval\(/g,
    severity: 'high' as const,
    message: 'Use of eval() - potential code injection',
  },
  {
    pattern: /dangerouslySetInnerHTML/g,
    severity: 'medium' as const,
    message: 'Use of dangerouslySetInnerHTML - potential XSS',
  },
  {
    pattern: /\.innerHTML\s*=/g,
    severity: 'medium' as const,
    message: 'Direct innerHTML assignment - potential XSS',
  },
  {
    pattern: /console\.(log|error|warn|debug)/g,
    severity: 'low' as const,
    message: 'Console statement - remove in production',
    exclude: ['/test/', '/scripts/'],
  },
  {
    pattern: /TODO:|FIXME:|HACK:/gi,
    severity: 'low' as const,
    message: 'Unresolved TODO/FIXME/HACK comment',
  },
  {
    pattern: /window\.(localStorage|sessionStorage)\.setItem.*password/gi,
    severity: 'high' as const,
    message: 'Storing password in local/session storage',
  },
  {
    pattern: /fetch\(['"`]http:/gi,
    severity: 'medium' as const,
    message: 'Non-HTTPS fetch request',
  },
]

function shouldExcludeFile(filePath: string, excludePatterns?: string[]): boolean {
  if (!excludePatterns) return false
  return excludePatterns.some(pattern => filePath.includes(pattern))
}

function scanFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  SECURITY_PATTERNS.forEach(({ pattern, severity, message, exclude }) => {
    if (shouldExcludeFile(filePath, exclude)) return

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        issues.push({
          file: filePath,
          line: index + 1,
          severity,
          issue: message,
          code: line.trim(),
        })
      }
    })
  })
}

function scanDirectory(dir: string) {
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    // Skip node_modules, .next, .git
    if (
      entry === 'node_modules' ||
      entry === '.next' ||
      entry === '.git' ||
      entry === 'dist' ||
      entry === 'build'
    ) {
      continue
    }

    if (stat.isDirectory()) {
      scanDirectory(fullPath)
    } else if (entry.match(/\.(ts|tsx|js|jsx)$/)) {
      scanFile(fullPath)
    }
  }
}

// Run scan
console.log('🔍 Running security scan...\n')
const startDir = join(process.cwd(), 'src')
scanDirectory(startDir)

// Group by severity
const grouped = {
  high: issues.filter(i => i.severity === 'high'),
  medium: issues.filter(i => i.severity === 'medium'),
  low: issues.filter(i => i.severity === 'low'),
}

// Report
console.log(`Found ${issues.length} potential security issues:\n`)

if (grouped.high.length > 0) {
  console.log(`🚨 HIGH SEVERITY (${grouped.high.length}):`)
  grouped.high.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`  ${issue.issue}`)
    console.log(`  ${issue.code}\n`)
  })
}

if (grouped.medium.length > 0) {
  console.log(`⚠️  MEDIUM SEVERITY (${grouped.medium.length}):`)
  grouped.medium.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`  ${issue.issue}`)
    console.log(`  ${issue.code}\n`)
  })
}

if (grouped.low.length > 0) {
  console.log(`ℹ️  LOW SEVERITY (${grouped.low.length}):`)
  console.log(`  ${grouped.low.length} low-severity issues found`)
  console.log(`  Run with --verbose to see details\n`)
}

// Check RLS policies
console.log('\n📋 RLS Policy Checklist:')
console.log('  [ ] All tables have RLS enabled')
console.log('  [ ] Default deny-all policies')
console.log('  [ ] User can only see own data')
console.log('  [ ] Organizer can only see own events')
console.log('  [ ] Service role bypasses RLS (server-only)\n')

// Check environment variables
console.log('🔑 Environment Variable Checklist:')
console.log('  [ ] All secrets in .env.local (not committed)')
console.log('  [ ] .env.example has all required vars')
console.log('  [ ] NEXT_PUBLIC_ prefix only for public vars')
console.log('  [ ] Service role key never exposed to client\n')

// Exit with error if high severity issues found
if (grouped.high.length > 0) {
  console.log('❌ Security scan failed - fix high severity issues')
  process.exit(1)
} else {
  console.log('✅ No high-severity security issues found')
  process.exit(0)
}
